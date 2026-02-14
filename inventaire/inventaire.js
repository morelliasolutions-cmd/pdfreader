// Variables globales
let currentDepotId = null;
let allInventoryData = [];

// Fonctions de chargement (remplacement de database.js)
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
  
  console.log('hideLoading appelé');
  
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
    console.log('Loading caché');
  }
  if (mainContent) {
    mainContent.style.display = 'block';
    console.log('main-content affiché avec block');
  }
}

// Charger les dépôts et initialiser le sélecteur
async function loadDepots() {
  try {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
      throw new Error('Supabase client non initialisé');
    }
    
    // Vérifier à nouveau la session avant de charger les données
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    const { data, error } = await window.supabase
      .from('depots')
      .select('*')
      .order('name');
    
    if (error) {
      // Si l'erreur est liée à l'authentification, rediriger
      if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('authentication')) {
        console.warn('⚠️ Erreur d\'authentification, redirection...');
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        if (window.location.pathname.includes('/inventaire/')) {
          window.location.href = '../index.html';
        } else {
          window.location.href = 'index.html';
        }
        return;
      }
      throw error;
    }
    
    const selector = document.getElementById('depot-selector');
    selector.innerHTML = '<option value="">Sélectionner un dépôt...</option>';
    
    if (data && data.length > 0) {
      data.forEach(depot => {
        const option = document.createElement('option');
        option.value = depot.id;
        option.textContent = depot.name;
        selector.appendChild(option);
      });
      
      // Charger le dépôt sauvegardé ou sélectionner le premier
      const savedDepotId = localStorage.getItem('selected_depot_id');
      if (savedDepotId && data.find(d => d.id === savedDepotId)) {
        selector.value = savedDepotId;
        currentDepotId = savedDepotId;
      } else if (data.length > 0) {
        selector.value = data[0].id;
        currentDepotId = data[0].id;
        localStorage.setItem('selected_depot_id', data[0].id);
      }
      
      await loadData();
      hideLoading(); // Afficher le contenu après le chargement des données
    } else {
      selector.innerHTML = '<option value="">Aucun dépôt disponible</option>';
      hideLoading(); // Afficher le contenu même sans dépôts
    }
  } catch (error) {
    console.error('Erreur chargement dépôts:', error);
    hideLoading(); // Afficher le contenu même en cas d'erreur
    
    // Vérifier si c'est une erreur d'authentification
    if (error.message && (error.message.includes('JWT') || error.message.includes('authentication') || error.message.includes('session'))) {
      alert('Votre session a expiré. Veuillez vous reconnecter.');
      if (window.location.pathname.includes('/inventaire/')) {
        window.location.href = '../index.html';
      } else {
        window.location.href = 'index.html';
      }
      return;
    }
    
    // Vérifier si c'est une erreur réseau
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      alert('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      return;
    }
    
    alert('Erreur lors du chargement des dépôts: ' + (error.message || 'Erreur inconnue'));
  }
}

// Gérer le changement de dépôt
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('depot-selector').addEventListener('change', async (e) => {
    currentDepotId = e.target.value;
    if (currentDepotId) {
      localStorage.setItem('selected_depot_id', currentDepotId);
      await loadData();
    } else {
      allInventoryData = [];
      renderTable([]);
      updateStats([]);
    }
  });
});

// Charger les données depuis Supabase
async function loadData() {
  if (!currentDepotId) {
    allInventoryData = [];
    renderTable([]);
    updateStats([]);
    return;
  }
  
  if (!window.supabase || typeof window.supabase.from !== 'function') {
    console.error('Supabase client non initialisé');
    return;
  }
  
  try {
    const { data, error } = await window.supabase
      .from('inventory_items')
      .select('*')
      .eq('depot_id', currentDepotId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Obtenir le nombre de techniciens actifs une seule fois
    const activeCollaborators = await getActiveCollaboratorsCount();
    
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
        recommended: recommended // Stocker le résultat calculé
      };
    });
    
    renderTable(allInventoryData);
    updateStats(allInventoryData);
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    alert('Erreur lors du chargement des données');
  }
}

// Calculer le stock recommandé
async function calculateRecommended(quantity, threshold, monthly_need, weekly_need) {
  // Calcul : besoin hebdomadaire × nombre de techniciens actifs
  const activeCollaborators = await getActiveCollaboratorsCount();
  const recommended = weekly_need * activeCollaborators;
  return recommended;
}

// Obtenir le nombre de collaborateurs actifs depuis Supabase
async function getActiveCollaboratorsCount() {
  try {
    const { count, error } = await window.supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Actif')
      .eq('type', 'Technicien');
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erreur lors du comptage des collaborateurs actifs:', error);
    return 0;
  }
}

// Obtenir la couleur du statut
function getStatusColor(quantity, threshold) {
  if (quantity < threshold) return 'bg-orange-500';
  return 'bg-green-500';
}

// Rendre le tableau
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
    
    // Image par défaut (placeholder gris simple)
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
        <div class="flex items-center justify-center gap-2">
          <button onclick="quickUpdateQuantity('${item.id}', ${item.quantity || 0} - 1)" class="text-gray-500 hover:text-primary dark:hover:text-primary transition-colors" title="Diminuer">
            <span class="material-symbols-outlined text-lg">remove</span>
          </button>
          <span class="text-gray-900 dark:text-white font-medium min-w-[3rem] text-center">${item.quantity}</span>
          <button onclick="quickUpdateQuantity('${item.id}', ${item.quantity || 0} + 1)" class="text-gray-500 hover:text-primary dark:hover:text-primary transition-colors" title="Augmenter">
            <span class="material-symbols-outlined text-lg">add</span>
          </button>
        </div>
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
        <button onclick="editItem('${item.id}')" class="text-primary hover:underline">
          <span class="material-symbols-outlined text-base align-middle">edit</span>
        </button>
        <button onclick="deleteItem('${item.id}')" class="text-red-500 hover:text-red-700">
          <span class="material-symbols-outlined text-base align-middle">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Mettre à jour les statistiques
function updateStats(data) {
  const total = data.length;
  let ok = 0, low = 0, empty = 0;
  let totalValue = 0;
  
  data.forEach(item => {
    const itemValue = (item.price || 0) * (item.quantity || 0);
    totalValue += itemValue;
    
    if (item.quantity === 0) {
      empty++;
    } else if (item.quantity <= item.threshold) {
      low++;
    } else {
      ok++;
    }
  });
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-ok').textContent = ok;
  document.getElementById('stat-low').textContent = low;
  document.getElementById('stat-empty').textContent = empty;
  document.getElementById('stat-total-value').textContent = totalValue.toFixed(2) + ' CHF';
}

// Ouvrir le site du produit
function openProductWebsite(url, productName) {
  if (url && url.trim()) {
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  } else {
    alert(`Aucun lien disponible pour le produit "${productName}".\nVous pouvez ajouter un lien dans le champ "Lien vers le site" lors de la modification de l'article.`);
  }
}

// Fonction d'export Excel
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('export-excel-btn').addEventListener('click', () => {
    if (allInventoryData.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    try {
      // Préparer les données pour Excel
      const data = allInventoryData.map(item => {
        const prixTotal = (item.price || 0) * (item.quantity || 0);
        
        return {
          'Référence': item.reference,
          'Nom': item.name,
          'Catégorie': item.category,
          'Fournisseur': item.supplier || '',
          'Prix Unitaire (CHF)': item.price || 0,
          'Quantité': item.quantity || 0,
          'Prix Total (CHF)': prixTotal,
          'Seuil': item.threshold || 0
        };
      });
      
      // Créer le workbook et la worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 15 }, // Référence
        { wch: 30 }, // Nom
        { wch: 15 }, // Catégorie
        { wch: 20 }, // Fournisseur
        { wch: 18 }, // Prix Unitaire
        { wch: 10 }, // Quantité
        { wch: 18 }, // Prix Total
        { wch: 10 }  // Seuil
      ];
      ws['!cols'] = colWidths;
      
      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventaire');
      
      // Générer le fichier et le télécharger
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `inventaire_${date}.xlsx`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export: ' + error.message);
    }
  });
});

// Gestion du modal
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-btn');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const itemForm = document.getElementById('item-form');

document.addEventListener('DOMContentLoaded', () => {
  addBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Ajouter un article';
    itemForm.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('preview-container').classList.add('hidden');
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Preview de l'URL de photo
  document.getElementById('photo').addEventListener('input', (e) => {
    const url = e.target.value;
    if (url) {
      document.getElementById('photo-preview').src = url;
      document.getElementById('preview-container').classList.remove('hidden');
    } else {
      document.getElementById('preview-container').classList.add('hidden');
    }
  });

  // Soumettre le formulaire
  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentDepotId) {
      alert('Veuillez sélectionner un dépôt');
      return;
    }
    
    const reference = document.getElementById('reference').value.trim();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value;
    const supplier = document.getElementById('supplier').value.trim();
    const price = parseFloat(document.getElementById('price').value) || 0;
    const quantity = parseInt(document.getElementById('quantity').value);
    const threshold = parseInt(document.getElementById('threshold').value);
    const photo = document.getElementById('photo').value.trim();
    const website_url = document.getElementById('website_url').value.trim();
    const weekly_need = parseInt(document.getElementById('weekly_need').value) || 0;
    const id = document.getElementById('item-id').value;
    
    try {
      const itemData = {
        depot_id: currentDepotId,
        reference,
        name,
        category,
        supplier: supplier || null,
        price,
        quantity,
        threshold,
        photo: photo || null,
        website_url: website_url || null,
        weekly_need,
        monthly_need: 0
      };
      
      if (id) {
        // Modifier
        const { error } = await window.supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Créer
        const { error } = await window.supabase
          .from('inventory_items')
          .insert(itemData);
        
        if (error) throw error;
      }
      
      await loadData();
      modal.classList.add('hidden');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur: ' + error.message);
    }
  });
});

// Modifier un élément
async function editItem(id) {
  try {
    const item = allInventoryData.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('modal-title').textContent = 'Modifier l\'article';
    document.getElementById('item-id').value = item.id;
    document.getElementById('reference').value = item.reference;
    document.getElementById('name').value = item.name;
    document.getElementById('category').value = item.category || 'Outils';
    document.getElementById('supplier').value = item.supplier || '';
    document.getElementById('price').value = item.price || 0;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('threshold').value = item.threshold;
    document.getElementById('photo').value = item.photo || '';
    document.getElementById('website_url').value = item.website_url || '';
    document.getElementById('weekly_need').value = item.weekly_need || 0;
    
    if (item.photo) {
      document.getElementById('photo-preview').src = item.photo;
      document.getElementById('preview-container').classList.remove('hidden');
    } else {
      document.getElementById('preview-container').classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
  }
}

// Modification rapide de la quantité
async function quickUpdateQuantity(id, newQuantity) {
  if (newQuantity < 0) {
    alert('La quantité ne peut pas être négative');
    return;
  }
  
  try {
    const { error } = await window.supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', id);
    
    if (error) throw error;
    
    // Mettre à jour localement pour un feedback immédiat
    const item = allInventoryData.find(i => i.id === id);
    if (item) {
      item.quantity = newQuantity;
    }
    
    await loadData();
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    alert('Erreur lors de la mise à jour: ' + error.message);
  }
}

// Supprimer un élément
async function deleteItem(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    try {
      const { error } = await window.supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }
}

// Recherche avec mise à jour dynamique des KPI
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filtered = allInventoryData.filter(item => 
      item.reference.toLowerCase().includes(searchTerm) ||
      item.name.toLowerCase().includes(searchTerm) ||
      (item.category && item.category.toLowerCase().includes(searchTerm)) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm))
    );
    
    renderTable(filtered);
    // Mettre à jour les KPI avec les données filtrées
    updateStats(filtered);
  });
});

// Initialiser l'application
// Activer le lien actif dans la navbar
function activateNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'inventaire.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'inventaire.html')) {
      link.classList.add('bg-primary/10', 'text-primary', 'font-medium');
    } else {
      link.classList.remove('bg-primary/10', 'text-primary', 'font-medium');
    }
  });
}

// Gestion du menu profil
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('profile-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('profile-menu');
    menu.classList.toggle('hidden');
  });

  // Fermer le menu si on clique ailleurs
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-menu');
    const profileBtn = document.getElementById('profile-btn');
    if (!menu.contains(e.target) && e.target !== profileBtn) {
      menu.classList.add('hidden');
    }
  });
});

// Fonctions exposées globalement pour les événements onclick
window.editItem = editItem;
window.deleteItem = deleteItem;
window.quickUpdateQuantity = quickUpdateQuantity;
window.openProductWebsite = openProductWebsite;

// Initialiser Supabase et charger les dépôts
document.addEventListener('DOMContentLoaded', async () => {
  showLoading('Initialisation de Supabase...');
  
  // Vérifier que Supabase est chargé (attendre que config.js l'initialise)
  let attempts = 0;
  while ((!window.supabase || typeof window.supabase.from !== 'function') && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
    
    // Si la bibliothèque Supabase est chargée mais pas le client, essayer d'initialiser
    if (typeof window.supabase !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && typeof window.supabase.from !== 'function') {
      // Réinitialiser si nécessaire
      if (window.SUPABASE_CONFIG) {
        const SupabaseLib = window.supabase;
        window.supabase = SupabaseLib.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
      }
    }
  }
  
  if (window.supabase && typeof window.supabase.from === 'function') {
    console.log('✅ Supabase initialisé avec succès');
    
    // Vérifier l'authentification avant de charger les données
    try {
      const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.warn('⚠️ Utilisateur non connecté, redirection vers la page de connexion');
        hideLoading();
        alert('Vous devez être connecté pour accéder à cette page.\n\nRedirection vers la page de connexion...');
        // Rediriger vers la page de connexion appropriée
        // Si on est dans le dossier inventaire, rediriger vers index.html à la racine
        if (window.location.pathname.includes('/inventaire/')) {
          window.location.href = '../index.html';
        } else {
          window.location.href = 'index.html';
        }
        return;
      }
      
      console.log('✅ Utilisateur authentifié:', session.user.email);
      
      // Afficher le nom de l'utilisateur
      const userNameElement = document.getElementById('user-name');
      const userRoleElement = document.getElementById('user-role');
      const userInitialsElement = document.getElementById('user-initials');
      
      if (userNameElement) {
        // Utiliser l'email ou le nom complet si disponible
        const displayName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           session.user.email.split('@')[0];
        userNameElement.textContent = displayName;
        
        // Mettre à jour les initiales
        if (userInitialsElement) {
          const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 
                          session.user.email[0].toUpperCase();
          userInitialsElement.textContent = initials;
        }
      }
      
      // Récupérer le rôle de l'utilisateur
      if (userRoleElement && window.supabase) {
        try {
          const { data: roleData } = await window.supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (roleData && roleData.role) {
            const roleNames = {
              'admin': 'Administrateur',
              'direction': 'Direction',
              'chef_chantier': 'Chef de chantier',
              'dispatcher': 'Dispatcher',
              'technicien': 'Technicien'
            };
            userRoleElement.textContent = roleNames[roleData.role] || roleData.role;
          }
        } catch (error) {
          console.warn('Erreur lors de la récupération du rôle:', error);
        }
      }
      
      // Ne pas cacher le loading ici, attendre que loadDepots() finisse
      await loadDepots();
      activateNavLink();
    } catch (authError) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', authError);
      hideLoading();
      alert('Erreur d\'authentification. Veuillez vous reconnecter.');
      if (window.location.pathname.includes('/inventaire/')) {
        window.location.href = '../index.html';
      } else {
        window.location.href = 'index.html';
      }
    }
  } else {
    console.error('❌ Supabase non chargé après', attempts, 'tentatives');
    console.error('window.supabase:', window.supabase);
    console.error('Type de window.supabase:', typeof window.supabase);
    
    hideLoading();
    
    // Afficher un message d'erreur plus informatif
    const errorMsg = 'Erreur: Supabase non chargé.\n\n' +
      'Vérifications:\n' +
      '1. Votre connexion internet est active\n' +
      '2. Les paramètres de sécurité du navigateur autorisent les scripts\n' +
      '3. Essayez de recharger la page (Ctrl+F5)\n\n' +
      'Les avertissements "Tracking Prevention" sont normaux dans Edge et ne bloquent pas le fonctionnement.';
    
    alert(errorMsg);
  }
});
