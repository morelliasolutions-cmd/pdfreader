/**
 * Configuration Supabase - Veloxnumeric
 * ✅ Connecté à Supabase Cloud
 */

// ⚙️ CONFIGURATION: Utilisation de Supabase Cloud
// Forcé à false pour toujours utiliser Supabase Cloud
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';
const USE_LOCAL_SUPABASE = false; // Toujours utiliser Supabase Cloud

// Configuration Supabase Cloud
const SUPABASE_CLOUD_URL = 'https://wdurkaelytgjbcsmkzgb.supabase.co';
const SUPABASE_CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkdXJrYWVseXRnamJjc21remdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODc0NDksImV4cCI6MjA4MjM2MzQ0OX0.E7R_3Ylk1Tf8FJurHfzhb-QgHokeVORpk99_nukjYZY';

// Configuration Supabase Local
// Détection automatique : localhost pour développement local, IP VPS pour production
const SUPABASE_LOCAL_URL = isLocalhost 
    ? 'http://localhost:8000'  // Développement local
    : 'http://76.13.133.147:8000';  // VPS Production

// ANON_KEY - Utilise les clés du serveur (elles fonctionnent aussi en local)
const SUPABASE_LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5NzgwODA3LCJleHAiOjIwODUxNDA4MDd9.dm1lv4aQemVlAmm92bVZl5V7RWOVLlz9Kn8oNcVbSxs';

// Sélection automatique de la configuration
const SUPABASE_URL = USE_LOCAL_SUPABASE ? SUPABASE_LOCAL_URL : SUPABASE_CLOUD_URL;
const SUPABASE_ANON_KEY = USE_LOCAL_SUPABASE ? SUPABASE_LOCAL_ANON_KEY : SUPABASE_CLOUD_ANON_KEY;

// Afficher dans la console quelle instance est utilisée
const envLabel = USE_LOCAL_SUPABASE 
    ? (isLocalhost ? 'LOCAL (localhost)' : 'LOCAL (VPS)')
    : 'CLOUD';
console.log(`🔌 Connexion à Supabase: ${envLabel}`, SUPABASE_URL);

// ✅ Configuration pour api.js (pour compatibilité)
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// ✅ Fonction pour initialiser Supabase (attendre que la bibliothèque soit chargée)
function initSupabase() {
  // Si window.supabase (bibliothèque) n'est pas encore chargée, attendre
  if (typeof window.supabase === 'undefined' || !window.supabase || typeof window.supabase.createClient !== 'function') {
    // La bibliothèque n'est pas encore chargée, on attendra dans les fichiers HTML
    return false;
  }
  
  // ✅ IMPORTANT: Sauvegarder la bibliothèque Supabase avant de créer le client
  const SupabaseLib = window.supabase;
  
  // ✅ Créer le client Supabase
  const supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // ✅ Rendre disponible globalement
  window.supabase = supabaseClient;
  
  return true;
}

// ✅ Essayer d'initialiser immédiatement (si la bibliothèque est déjà chargée)
if (typeof window.supabase !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
  initSupabase();
} else {
  // Sinon, attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Attendre un peu pour que le script CDN soit chargé
      setTimeout(() => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (initSupabase() || attempts >= 20) {
            clearInterval(checkInterval);
          }
        }, 100);
      }, 100);
    });
  } else {
    // DOM déjà chargé
    setTimeout(() => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (initSupabase() || attempts >= 20) {
          clearInterval(checkInterval);
        }
      }, 100);
    }, 100);
  }
}
