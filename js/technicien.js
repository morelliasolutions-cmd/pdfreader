// Variables globales
let currentDepotId = null;
let allInventoryData = [];

// Configuration du cache (74h)
const CACHE_TTL = 74 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = 'technicien_v1_';

// Helpers Cache
function saveToCache(key, data) {
  try {
    const cacheItem = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheItem));
  } catch (e) {
    console.warn('Erreur sauvegarde cache:', e);
  }
}

function loadFromCache(key) {
  try {
    const json = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!json) return null;
    const cacheItem = JSON.parse(json);
    if (Date.now() - cacheItem.timestamp < CACHE_TTL) {
      console.log(`📦 Chargé depuis le cache: ${key}`);
      return cacheItem.data;
    }
    return null;
  } catch (e) {
    console.warn('Erreur lecture cache:', e);
    return null;
  }
}

// Fonctions de chargement
function showLoading(message) {
  if (!message) message = 'Chargement...';
  const loadingDiv = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  
  if (loadingDiv) {
    loadingDiv.innerHTML = '<div class="flex items-center justify-center fixed inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-40">' +
      '<div class="text-center">' +
      '<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>' +
      '<p class="text-gray-600 dark:text-gray-400">' + message + '</p>' +
      '</div>' +
      '</div>';
    loadingDiv.style.display = 'block';
  }
  if (mainContent) {
    mainContent.style.display = 'none';
  }
}

function hideLoading() {
  const loadingDiv = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }
  if (mainContent) {
    mainContent.style.display = '';
    if (mainContent.style.display === 'none') {
        mainContent.style.display = 'flex';
    }
  }
}

// Helper pour remplir le sélecteur
function populateDepotSelector(data) {
  const selector = document.getElementById('depot-selector');
  if (!selector) return;
  const currentValue = selector.value;
  selector.innerHTML = '<option value="">Sélectionner un dépôt...</option>';
  data.forEach(depot => {
      const option = document.createElement('option');
      option.value = depot.id;
      option.textContent = depot.name;
      selector.appendChild(option);
  });
  const savedDepotId = localStorage.getItem('technicien_selected_depot_id');
  if (currentValue && data.find(d => d.id === currentValue)) {
      selector.value = currentValue;
  } else if (savedDepotId && data.find(d => d.id === savedDepotId)) {
      selector.value = savedDepotId;
      currentDepotId = savedDepotId;
  } else if (data.length > 0 && !currentDepotId) {
      selector.value = data[0].id;
      currentDepotId = data[0].id;
      localStorage.setItem('technicien_selected_depot_id', data[0].id);
  }
}

// Charger les dépôts
async function loadDepots() {
  const cachedDepots = loadFromCache('depots');
  let loadedFromCache = false;

  if (cachedDepots && cachedDepots.length > 0) {
    console.log('📦 Dépôts chargés depuis le cache');
    populateDepotSelector(cachedDepots);
    loadedFromCache = true;
    hideLoading();

    if (localStorage.getItem('technicien_selected_depot_id')) {
        currentDepotId = localStorage.getItem('technicien_selected_depot_id');
        loadData();
    }
  }

  try {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      if (!loadedFromCache) throw new Error('Supabase client non initialisé');
      return;
    }
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      if (!loadedFromCache) throw new Error('Session expirée. Veuillez vous reconnecter.');
      console.log('⚠️ Session offline, utilisation du cache');
      return;
    }
    
    const { data, error } = await window.supabase
      .from('depots')
      .select('*')
      .order('name');
    
    if (error) {
      if (loadedFromCache) return;
      throw error;
    }
    
    if (data && data.length > 0) {
      saveToCache('depots', data);
      populateDepotSelector(data);
      if (!loadedFromCache) {
         await loadData();
         hideLoading(); 
      } else {
         loadData();
      }
    } else {
      const selector = document.getElementById('depot-selector');
      if (selector) selector.innerHTML = '<option value="">Aucun dépôt disponible</option>';
      if (!loadedFromCache) hideLoading();
    }
  } catch (error) {
    console.error('Erreur chargement dépôts:', error);
    if (!loadedFromCache) {
      hideLoading();
      alert('Erreur lors du chargement des dépôts: ' + (error.message || 'Erreur inconnue'));
    }
  }
}

// Gérer le changement de dépôt
document.addEventListener('DOMContentLoaded', () => {
  const depotSelector = document.getElementById('depot-selector');
  if (depotSelector) {
    depotSelector.addEventListener('change', async (e) => {
      currentDepotId = e.target.value;
      if (currentDepotId) {
        localStorage.setItem('technicien_selected_depot_id', currentDepotId);
        await loadData();
      } else {
        allInventoryData = [];
        renderTable([]);
        updateStats([]);
      }
    });
  }
});

// Charger les données
async function loadData() {
  if (!currentDepotId) {
    allInventoryData = [];
    renderTable([]);
    updateStats([]);
    return;
  }
  
  const cacheKey = `items_${currentDepotId}`;
  const cachedData = loadFromCache(cacheKey);
  const cachedCollaborators = loadFromCache('active_collaborators_count');
  
  let loadedFromCache = false;
  
  if (cachedData) {
    console.log('📦 Inventaire chargé depuis le cache');
    const activeCollaborators = cachedCollaborators || 0;
    processAndRenderData(cachedData, activeCollaborators);
    loadedFromCache = true;
  }

  if (!window.supabase || typeof window.supabase.from !== 'function') {
    if (!loadedFromCache) console.error('Supabase client non initialisé');
    return;
  }
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session && loadedFromCache) {
         console.warn('Session offline, données affichées depuis le cache');
         return;
    }

    const { data, error } = await window.supabase
      .from('inventory_items')
      .select('*')
      .eq('depot_id', currentDepotId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const activeCollaborators = await getActiveCollaboratorsCount();
    
    saveToCache(cacheKey, data);
    processAndRenderData(data, activeCollaborators);
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    if (!loadedFromCache) {
         alert('Erreur lors du chargement des données');
    }
  }
}

function processAndRenderData(data, activeCollaborators) {
    allInventoryData = (data || []).map(item => {
      const weekly_need = parseInt(item.weekly_need) || 0;
      const recommended = weekly_need * activeCollaborators;
      
      return {
        id: item.id,
        reference: item.reference,
        name: item.name,
        category: item.category || 'Outils',
        supplier: item.supplier || '',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 0,
        threshold: parseInt(item.threshold) || 0,
        photo: item.photo || null,
        website_url: item.website_url || null,
        monthly_need: parseInt(item.monthly_need) || 0,
        weekly_need: weekly_need,
        recommended: recommended
      };
    });
    
    renderTable(allInventoryData);
    updateStats(allInventoryData);
}

async function getActiveCollaboratorsCount() {
  const cached = loadFromCache('active_collaborators_count');
  if (cached !== null) {
      refreshCollaboratorsCount().catch(console.error);
      return cached;
  }
  return await refreshCollaboratorsCount();
}

async function refreshCollaboratorsCount() {
  if (!window.supabase) return 0;
  try {
    const { count, error } = await window.supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Actif')
      .eq('type', 'Technicien');
    
    if (error) throw error;
    const val = count || 0;
    saveToCache('active_collaborators_count', val);
    return val;
  } catch (error) {
    console.error('Erreur lors du comptage des collaborateurs actifs:', error);
    return 0;
  }
}

function getStatusColor(quantity, threshold) {
  if (quantity === 0) return 'bg-red-500';
  if (quantity <= threshold) return 'bg-orange-500';
  return 'bg-green-500';
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr class="bg-white dark:bg-background-dark/50">
        <td colspan="11" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
          Aucun élément trouvé. Cliquez sur "Ajouter un article" pour commencer.
        </td>
      </tr>
    `;
    return;
  }
  
  data.forEach(item => {
    const statusColor = getStatusColor(item.quantity, item.threshold);
    const tr = document.createElement('tr');
    tr.className = 'bg-white dark:bg-background-dark/50 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50';
    
    const defaultImage = 'https://via.placeholder.com/40x40/dddddd/999999?text=?';
    const imgSrc = item.photo || defaultImage;
    
    tr.innerHTML = `
      <td class="px-6 py-4">
        <img src="${imgSrc}" alt="${item.name}" class="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onerror="this.src='${defaultImage}'" onclick="openProductWebsite('${item.website_url || ''}', '${item.name}')" title="${item.website_url ? 'Cliquer pour ouvrir le site du produit' : 'Aucun lien disponible'}" />
      </td>
      <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${item.reference}</td>
      <td class="px-6 py-4 text-gray-700 dark:text-gray-300">${item.name}</td>
      <td class="px-6 py-4 text-gray-700 dark:text-gray-300">${item.category || 'Outils'}</td>
      <td class="px-6 py-4 text-gray-700 dark:text-gray-300">${item.supplier || '-'}</td>
      <td class="px-6 py-4 text-center">
        <span class="text-gray-900 dark:text-white font-medium">${item.quantity}</span>
      </td>
      <td class="px-6 py-4 text-center">
        <span class="inline-flex items-center justify-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full ${statusColor}"></span>
          <span class="text-gray-700 dark:text-gray-300">${item.threshold}</span>
        </span>
      </td>
      <td class="px-6 py-4 text-center text-gray-700 dark:text-gray-300">${item.price ? item.price.toFixed(2) : '0.00'}</td>
      <td class="px-6 py-4 text-center text-gray-700 dark:text-gray-300 font-medium">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
      <td class="px-6 py-4 text-center">
        <span class="inline-flex items-center justify-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full ${item.quantity >= (item.recommended || 0) ? 'bg-green-500' : 'bg-orange-500'}"></span>
          <span class="text-gray-700 dark:text-gray-300">${item.recommended || 0}</span>
        </span>
      </td>
      <td class="px-6 py-4 text-right space-x-2">
        <button class="text-primary hover:underline">
          <span class="material-symbols-outlined text-base align-middle">visibility</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats(data) {
  const total = data.length;
  const ok = data.filter(item => item.quantity > item.threshold).length;
  const low = data.filter(item => item.quantity > 0 && item.quantity <= item.threshold).length;
  const empty = data.filter(item => item.quantity === 0).length;
  const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-ok').textContent = ok;
  document.getElementById('stat-low').textContent = low;
  document.getElementById('stat-empty').textContent = empty;
  document.getElementById('stat-total-value').textContent = totalValue.toFixed(2) + ' CHF';
}

function openProductWebsite(url, productName) {
  if (!url) {
    alert(`Aucun lien disponible pour "${productName}"`);
    return;
  }
  window.open(url, '_blank');
}

// Recherche
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = allInventoryData.filter(item => 
        item.reference.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.supplier && item.supplier.toLowerCase().includes(search))
      );
      renderTable(filtered);
    });
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  const cachedDepots = loadFromCache('depots');
  
  if (cachedDepots) {
      console.log('🚀 Démarrage rapide via cache');
      populateDepotSelector(cachedDepots);
      if (localStorage.getItem('technicien_selected_depot_id')) {
          currentDepotId = localStorage.getItem('technicien_selected_depot_id');
          const cachedItems = loadFromCache(`items_${currentDepotId}`);
          if (cachedItems) {
               const cachedCollab = loadFromCache('active_collaborators_count') || 0;
               processAndRenderData(cachedItems, cachedCollab);
               hideLoading();
          }
      }
  }
  
  // Attendre Supabase
  let attempts = 0;
  while ((!window.supabase || typeof window.supabase.from !== 'function') && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.supabase && typeof window.supabase.from === 'function') {
    console.log('✅ Supabase initialisé');
    
    try {
      const { data: { session } } = await window.supabase.auth.getSession();
      
      if (!session) {
        if (cachedDepots) {
          console.warn('Mode hors ligne');
          return;
        }
        window.location.href = '../index.html';
        return;
      }
      
      await loadDepots();
    } catch (error) {
      console.error('Erreur authentification:', error);
      if (!cachedDepots) {
        hideLoading();
        window.location.href = '../index.html';
      }
    }
  } else {
    if (!cachedDepots) {
      console.error('❌ Supabase non chargé');
      hideLoading();
      alert('Erreur: Supabase non chargé. Vérifiez votre connexion internet.');
    }
  }
});
