/**
 * Système de contrôle d'accès basé sur les rôles RLS
 * Gère les permissions pour chaque rôle utilisateur
 */

// Configuration des permissions par rôle
const ROLE_PERMISSIONS = {
    'admin': {
        // Admin a accès à tout sauf app mobile technicien
        pages: {
            'dashboard.html': true,
            'pointage.html': true,
            'production.html': true,
            'personnel.html': true,
            'planif.html': true,
            'gantt-mensuel.html': true,
            'mandats.html': true,
            'inventaire/inventaire.html': true,
            'inventaire.html': true,
            'technicien.html': true,
            'collaborateurs.html': true,
            'vehicule.html': true,
            'commandes.html': true,
            'parametres.html': true
        },
        // Permissions spéciales
        canEditPersonnel: true,
        canEditInventaire: true,
        canEditPlanning: true,
        canEditPointage: true,
        canEditProduction: true,
        canEditMandats: true
    },
    'chef_chantier': {
        pages: {
            'dashboard.html': false, // Pas d'accès au tableau de bord
            'pointage.html': true,
            'production.html': true,
            'personnel.html': true, // Lecture seule
            'planif.html': true,
            'gantt-mensuel.html': true,
            'mandats.html': true,
            'inventaire/inventaire.html': true,
            'inventaire.html': true,
            'technicien.html': true,
            'collaborateurs.html': true,
            'vehicule.html': true,
            'commandes.html': true,
            'parametres.html': false // Pas d'accès aux paramètres
        },
        canEditPersonnel: false, // Lecture seule
        canEditInventaire: true,
        canEditPlanning: true,
        canEditPointage: true,
        canEditProduction: true,
        canEditMandats: true
    },
    'dispatcher': {
        pages: {
            'dashboard.html': false, // Pas d'accès au tableau de bord
            'pointage.html': false, // Pas d'accès au pointage
            'production.html': false, // Pas d'accès à la production
            'personnel.html': true, // Lecture seule
            'planif.html': true,
            'gantt-mensuel.html': true,
            'mandats.html': true,
            'inventaire/inventaire.html': true,
            'inventaire.html': true,
            'technicien.html': true,
            'collaborateurs.html': true,
            'vehicule.html': true,
            'commandes.html': true,
            'parametres.html': false // Pas d'accès aux paramètres
        },
        canEditPersonnel: false, // Lecture seule
        canEditInventaire: true,
        canEditPlanning: true,
        canEditPointage: false,
        canEditProduction: false,
        canEditMandats: true
    },
    'technicien': {
        // Technicien n'a accès qu'à l'app mobile (géré séparément)
        pages: {
            'dashboard.html': false,
            'pointage.html': false,
            'production.html': false,
            'personnel.html': false,
            'planif.html': false,
            'inventaire/inventaire.html': false,
            'parametres.html': false
        },
        canEditPersonnel: false,
        canEditInventaire: false,
        canEditPlanning: false,
        canEditPointage: false,
        canEditProduction: false,
        canEditMandats: false
    }
};

// Mapping des fichiers vers leurs identifiants
const PAGE_IDS = {
    'dashboard.html': 'nav-dashboard',
    'pointage.html': 'nav-pointage',
    'production.html': 'nav-production',
    'personnel.html': 'nav-personnel',
    'planif.html': 'nav-planning',
    'mandats.html': 'nav-mandat',
    'inventaire/inventaire.html': 'nav-inventaire',
    'commandes.html': 'nav-commandes',
    'parametres.html': 'nav-parametres'
};

let currentUserRole = null;
let currentUser = null; // Variable globale pour l'utilisateur actuel

// Rendre currentUser accessible globalement via window
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'currentUser', {
        get: () => currentUser,
        set: (value) => { currentUser = value; },
        configurable: true
    });
}

/**
 * Récupère le rôle de l'utilisateur connecté depuis Supabase
 */
async function getUserRole() {
    try {
        // Vérifier si Supabase est initialisé (attendre un peu si nécessaire)
        let supabaseClient = window.supabase;
        
        // Attendre que Supabase soit initialisé (max 3 secondes)
        let attempts = 0;
        while ((!supabaseClient || typeof supabaseClient.auth === 'undefined') && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            supabaseClient = window.supabase;
            attempts++;
        }
        
        if (!supabaseClient || typeof supabaseClient.auth === 'undefined') {
            console.warn('Supabase non initialisé');
            return getCachedRole(); // Retourner le rôle en cache si disponible
        }

        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            console.warn('Utilisateur non connecté');
            return null;
        }

        currentUser = user;

        // Récupérer le rôle depuis la table user_roles
        const { data: roleData, error: roleError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleError || !roleData) {
            console.warn('Rôle non trouvé pour l\'utilisateur');
            return null;
        }

        currentUserRole = roleData.role;
        return roleData.role;
    } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        return null;
    }
}

/**
 * Vérifie si l'utilisateur a accès à une page
 */
function hasPageAccess(pagePath) {
    if (!currentUserRole) return false;
    
    const permissions = ROLE_PERMISSIONS[currentUserRole];
    if (!permissions) return false;

    // Normaliser le chemin de la page
    const normalizedPath = pagePath.replace(/^\.\//, '').replace(/^\//, '');
    
    return permissions.pages[normalizedPath] === true || permissions.pages[pagePath] === true;
}

/**
 * Vérifie si l'utilisateur peut modifier une ressource
 */
function canEdit(resource) {
    if (!currentUserRole) return false;
    
    const permissions = ROLE_PERMISSIONS[currentUserRole];
    if (!permissions) return false;

    const permissionKey = `canEdit${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    return permissions[permissionKey] === true;
}

/**
 * Applique les restrictions d'accès à la navigation
 */
function applyNavigationRestrictions() {
    if (!currentUserRole) {
        // Si pas de rôle, masquer toute la navigation
        document.querySelectorAll('nav a, nav button').forEach(el => {
            if (!el.href || !el.href.includes('logout') && !el.href.includes('deconnexion')) {
                el.style.display = 'none';
            }
        });
        return;
    }

    const permissions = ROLE_PERMISSIONS[currentUserRole];
    if (!permissions) return;

    // Masquer les liens de navigation non autorisés
    document.querySelectorAll('nav a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Extraire le nom du fichier
        let pagePath = href.split('/').pop() || href;
        const fullPath = href;
        
        // Gérer les chemins relatifs avec sous-dossiers
        if (href.includes('inventaire/')) {
            pagePath = 'inventaire/inventaire.html';
        }

        // Vérifier l'accès
        if (!hasPageAccess(pagePath) && !hasPageAccess(fullPath) && !hasPageAccess(href)) {
            link.style.display = 'none';
            // Aussi masquer le parent si c'est un élément de liste
            const parent = link.closest('li');
            if (parent) parent.style.display = 'none';
        }
    });
}

/**
 * Vérifie l'accès à la page actuelle et redirige si nécessaire
 */
function checkPageAccess() {
    // Extraire le nom de la page actuelle
    let currentPage = window.location.pathname.split('/').pop() || window.location.pathname;
    
    // Si c'est vide ou juste "/", utiliser index.html
    if (!currentPage || currentPage === '/') {
        currentPage = 'index.html';
    }
    
    // Pour les pages dans des sous-dossiers (ex: inventaire/inventaire.html)
    if (window.location.pathname.includes('inventaire/')) {
        currentPage = 'inventaire/inventaire.html';
    }
    
    if (!hasPageAccess(currentPage)) {
        // Rediriger vers une page autorisée ou afficher un message
        const permissions = ROLE_PERMISSIONS[currentUserRole];
        if (permissions) {
            // Trouver la première page autorisée
            const allowedPage = Object.keys(permissions.pages).find(
                page => permissions.pages[page] === true
            );
            
            if (allowedPage) {
                window.location.href = allowedPage;
            } else {
                // Aucune page autorisée, rediriger vers la page de connexion
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

/**
 * Applique les restrictions d'édition sur la page actuelle
 */
function applyEditRestrictions() {
    if (!currentUserRole) return;

    // Personnel - Seuls les admins peuvent modifier
    if (window.location.pathname.includes('personnel.html')) {
        // Vérifier si l'utilisateur est admin
        const isAdmin = currentUserRole === 'admin';
        
        if (!isAdmin) {
            // Masquer les boutons d'ajout/modification (seuls les admins peuvent)
            if (!isAdmin) {
                // Méthode 1 : Par sélecteurs CSS
                const selectors = [
                    'button[onclick*="addEmployeeModal"]',
                    'button[onclick*="openEditModal"]',
                    'button[onclick*="edit"]',
                    'button[onclick*="delete"]'
                ];
                
                selectors.forEach(selector => {
                    try {
                        document.querySelectorAll(selector).forEach(btn => {
                            btn.style.display = 'none';
                        });
                    } catch (e) {
                        // Ignorer les sélecteurs invalides
                    }
                });
                
                // Méthode 2 : Par texte du bouton
                document.querySelectorAll('button').forEach(btn => {
                    const text = (btn.textContent || btn.innerText || '').toLowerCase();
                    if (text.includes('ajouter') && (text.includes('employé') || text.includes('personnel'))) {
                        btn.style.display = 'none';
                    }
                    if (text.includes('modifier') && (text.includes('profil') || text.includes('employé'))) {
                        btn.style.display = 'none';
                    }
                    if (text.includes('supprimer') || text.includes('delete')) {
                        btn.style.display = 'none';
                    }
                });
            }
            
            // Masquer spécifiquement le bouton "Ajouter un employé" (seuls les admins peuvent)
            if (!isAdmin) {
                const addEmployeeBtn = document.getElementById('btn-add-employee') || 
                                      document.querySelector('button[onclick*="addEmployeeModal"]') ||
                                      Array.from(document.querySelectorAll('button')).find(btn => 
                                          btn.textContent.includes('Ajouter un employé')
                                      );
                if (addEmployeeBtn) {
                    addEmployeeBtn.style.display = 'none';
                }
            }
            
            // Désactiver les champs de formulaire dans les modals
            setTimeout(() => {
                document.querySelectorAll('input:not([type="search"]):not([readonly]), textarea:not([readonly]), select:not([disabled])').forEach(input => {
                    if (!input.closest('form') || input.type === 'search') return;
                    input.readOnly = true;
                    input.disabled = true;
                    input.style.cursor = 'not-allowed';
                });
            }, 500);
            
            // Afficher un badge "Lecture seule"
            const mainContent = document.querySelector('main') || document.body;
            if (mainContent && !document.getElementById('readonly-badge')) {
                const readonlyBadge = document.createElement('div');
                readonlyBadge.id = 'readonly-badge';
                readonlyBadge.className = 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2';
                readonlyBadge.innerHTML = '<span class="material-symbols-outlined">info</span><span><strong>Mode lecture seule :</strong> Vous pouvez consulter les informations mais ne pouvez pas les modifier.</span>';
                const pageHeader = mainContent.querySelector('.flex.flex-col.md\\:flex-row') || mainContent.querySelector('h2')?.parentElement;
                if (pageHeader) {
                    pageHeader.insertAdjacentElement('afterend', readonlyBadge);
                } else if (mainContent.firstChild) {
                    mainContent.insertBefore(readonlyBadge, mainContent.firstChild);
                }
            }
        }
    }
    
    // Mandats - Vérifier les permissions d'édition
    if (window.location.pathname.includes('mandats.html')) {
        if (!canEdit('Mandats')) {
            // Masquer les boutons d'ajout/modification dans les mandats
            const addMandatBtn = document.getElementById('btn-add-mandat');
            if (addMandatBtn) {
                addMandatBtn.style.display = 'none';
            }
            
            // Désactiver les boutons d'assignation de techniciens
            document.querySelectorAll('button[onclick*="assignTechnicians"]').forEach(btn => {
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.5';
            });
            
            // Afficher un badge "Lecture seule"
            const mainContent = document.querySelector('main') || document.body;
            if (mainContent && !document.getElementById('readonly-badge')) {
                const readonlyBadge = document.createElement('div');
                readonlyBadge.id = 'readonly-badge';
                readonlyBadge.className = 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2';
                readonlyBadge.innerHTML = '<span class="material-symbols-outlined">info</span><span><strong>Mode lecture seule :</strong> Vous pouvez consulter les mandats mais ne pouvez pas les modifier.</span>';
                const pageHeader = mainContent.querySelector('.flex.flex-col.md\\:flex-row') || mainContent.querySelector('h2')?.parentElement;
                if (pageHeader) {
                    pageHeader.insertAdjacentElement('afterend', readonlyBadge);
                }
            }
        }
    }
    
    // Inventaire - Vérifier les permissions d'édition
    if (window.location.pathname.includes('inventaire')) {
        if (!canEdit('Inventaire')) {
            // Masquer les boutons d'ajout/modification dans l'inventaire
            document.querySelectorAll('button[onclick*="add"], button[onclick*="edit"], button[onclick*="delete"]').forEach(btn => {
                const text = btn.textContent || btn.innerText;
                if (text.includes('Ajouter') || text.includes('Modifier') || text.includes('Supprimer')) {
                    btn.style.display = 'none';
                }
            });
        }
    }
}

/**
 * Initialise le système de contrôle d'accès
 */
async function initRoleAccessControl() {
    // Récupérer le rôle de l'utilisateur
    const role = await getUserRole();
    
    if (!role) {
        console.warn('Impossible de déterminer le rôle utilisateur');
        
        // Vérifier si la redirection est désactivée pour cette page
        if (window.disableAuthRedirect) {
            console.log('🚫 Redirection automatique désactivée par la page');
            return;
        }

        // Rediriger vers la page de connexion si pas de rôle
        if (!window.location.pathname.includes('index.html')) {
            // Calculer le chemin relatif vers index.html en fonction de la profondeur
            let redirectPath = 'index.html';
            
            // Détection basique de dossier parent
            if (window.location.pathname.includes('/inventaire/') || 
                window.location.pathname.includes('/api/')) {
                redirectPath = '../index.html';
            } else if (window.location.pathname.includes('/App mobile/1/')) {
                redirectPath = '../../index.html';
            } else if (window.location.pathname.includes('/App mobile/')) {
                redirectPath = '../index.html';
            }
            
            console.log(`Redirection vers ${redirectPath}`);
            window.location.href = redirectPath;
        }
        return;
    }

    // Vérifier l'accès à la page actuelle
    if (!checkPageAccess()) {
        return;
    }

    // Appliquer les restrictions de navigation
    applyNavigationRestrictions();

    // Appliquer les restrictions d'édition
    applyEditRestrictions();

    // Stocker le rôle dans le localStorage pour un accès rapide
    localStorage.setItem('userRole', role);
    localStorage.setItem('userRoleTimestamp', Date.now().toString());
}

/**
 * Récupère le rôle depuis le cache (plus rapide)
 */
function getCachedRole() {
    const cachedRole = localStorage.getItem('userRole');
    const timestamp = localStorage.getItem('userRoleTimestamp');
    
    // Utiliser le cache si moins de 5 minutes
    if (cachedRole && timestamp && (Date.now() - parseInt(timestamp)) < 300000) {
        return cachedRole;
    }
    
    return null;
}

// Initialiser au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRoleAccessControl);
} else {
    initRoleAccessControl();
}

// Exporter pour utilisation dans d'autres scripts
const RoleAccessControl = {
    getUserRole,
    hasPageAccess,
    canEdit,
    ROLE_PERMISSIONS,
    currentUserRole: () => currentUserRole,
    resetUser: () => {
        currentUser = null;
        currentUserRole = null;
        if (typeof window !== 'undefined') {
            window.currentUser = null;
        }
        // Nettoyer le cache
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoleTimestamp');
    }
};

// Exporter pour Node.js (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleAccessControl;
}

// Exporter pour le navigateur
if (typeof window !== 'undefined') {
    window.RoleAccessControl = RoleAccessControl;
}

