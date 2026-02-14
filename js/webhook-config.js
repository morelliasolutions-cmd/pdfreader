/**
 * Configuration sécurisée des webhooks pour ConnectFiber
 * 
 * Ce module récupère la configuration depuis le backend de manière sécurisée
 * Conforme à AGENTS.md : Les secrets ne sont JAMAIS exposés côté client
 * 
 * ⚠️ SÉCURITÉ :
 * - Les URLs de webhooks et secrets JWT sont stockés dans .env (backend)
 * - Le frontend récupère UNIQUEMENT les URLs publiques via /api/config
 * - Les secrets ne sont JAMAIS exposés côté client
 * - L'authentification webhook est gérée côté backend
 * 
 * @author ConnectFiber / Morellia
 * @date 2026-02-14
 */

// Configuration globale
window.ConnectFiberConfig = window.ConnectFiberConfig || {};

/**
 * URLs des services backend (peuvent être changées en fonction de l'environnement)
 */
const BACKEND_SERVICES = {
    // Service d'extraction SAR
    sar_extraction: {
        dev: 'http://localhost:5001',
        prod: 'https://velox-sarpdf.yhmr4j.easypanel.host'
    },
    // Ajoutez d'autres services ici si nécessaire
};

/**
 * Détermine l'environnement actuel
 * @returns {'dev' | 'prod'}
 */
function getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'dev';
    }
    
    return 'prod';
}

/**
 * Récupère la configuration depuis le backend de manière sécurisée
 * 
 * ⚠️ IMPORTANT SÉCURITÉ :
 * - Les secrets (JWT, API keys) ne sont JAMAIS retournés par l'API
 * - Le backend gère l'authentification et l'envoi vers les webhooks
 * - Le frontend reçoit uniquement les URLs publiques nécessaires
 * 
 * @returns {Promise<Object>} Configuration publique
 */
async function loadWebhookConfig() {
    const env = getEnvironment();
    const baseUrl = BACKEND_SERVICES.sar_extraction[env];
    
    try {
        console.log('🔧 [CONFIG] Chargement de la configuration depuis le backend...');
        console.log(`🌍 [CONFIG] Environnement: ${env}`);
        console.log(`📡 [CONFIG] URL: ${baseUrl}`);
        
        const response = await fetch(`${baseUrl}/api/config`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            // Timeout de 5 secondes
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Stocker la config dans l'objet global
        window.ConnectFiberConfig = {
            ...window.ConnectFiberConfig,
            sar_extraction: {
                ...config,
                base_url: baseUrl,
                environment: env
            }
        };
        
        console.log('✅ [CONFIG] Configuration chargée avec succès');
        console.log('📊 [CONFIG] Détails:', {
            service: config.service,
            version: config.version,
            endpoints: config.endpoints,
            webhook_configured: config.webhook_configured
        });
        
        return config;
        
    } catch (error) {
        console.error('❌ [CONFIG] Erreur lors du chargement de la configuration:', error);
        
        // Configuration de fallback pour le développement local
        const fallbackConfig = {
            service: 'SAR Address Extraction',
            version: '1.0.0',
            endpoints: {
                extract: `${baseUrl}/api/extract-sar-address`,
                health: `${baseUrl}/api/health`
            },
            limits: {
                max_upload_mb: 50,
                extraction_timeout_seconds: 60
            },
            webhook_configured: false
        };
        
        window.ConnectFiberConfig.sar_extraction = {
            ...fallbackConfig,
            base_url: baseUrl,
            environment: env,
            error: error.message
        };
        
        console.warn('⚠️ [CONFIG] Utilisation de la configuration de secours');
        
        return fallbackConfig;
    }
}

/**
 * Récupère l'URL de l'endpoint d'extraction SAR
 * @returns {string} URL de l'endpoint
 */
function getSarExtractionUrl() {
    const config = window.ConnectFiberConfig?.sar_extraction;
    
    if (config && config.endpoints && config.endpoints.extract) {
        return config.endpoints.extract;
    }
    
    // Fallback
    const env = getEnvironment();
    const baseUrl = BACKEND_SERVICES.sar_extraction[env];
    return `${baseUrl}/api/extract-sar-address`;
}

/**
 * Récupère l'URL de health check SAR
 * @returns {string} URL de l'endpoint
 */
function getSarHealthUrl() {
    const config = window.ConnectFiberConfig?.sar_extraction;
    
    if (config && config.endpoints && config.endpoints.health) {
        return config.endpoints.health;
    }
    
    // Fallback
    const env = getEnvironment();
    const baseUrl = BACKEND_SERVICES.sar_extraction[env];
    return `${baseUrl}/api/health`;
}

/**
 * Vérifie si le service SAR est disponible
 * @returns {Promise<boolean>}
 */
async function checkSarServiceHealth() {
    try {
        const healthUrl = getSarHealthUrl();
        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('💚 [HEALTH] Service SAR disponible:', data);
            return true;
        }
        
        console.warn('⚠️ [HEALTH] Service SAR répond mais avec erreur:', response.status);
        return false;
        
    } catch (error) {
        console.error('❌ [HEALTH] Service SAR indisponible:', error);
        return false;
    }
}

/**
 * Initialisation au chargement de la page
 */
if (typeof document !== 'undefined') {
    // Charger la config dès que possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadWebhookConfig().catch(console.error);
        });
    } else {
        loadWebhookConfig().catch(console.error);
    }
}

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadWebhookConfig,
        getSarExtractionUrl,
        getSarHealthUrl,
        checkSarServiceHealth,
        getEnvironment
    };
}
