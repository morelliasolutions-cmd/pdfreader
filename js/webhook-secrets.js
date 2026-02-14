/**
 * Configuration des webhooks côté frontend
 * 
 * ⚠️ AVERTISSEMENT SÉCURITÉ :
 * Ce fichier contient des URLs de webhooks qui PEUVENT être exposées côté client.
 * Pour la PRODUCTION, utilisez un backend proxy qui gère l'authentification JWT.
 * 
 * Ce fichier est dans .gitignore pour éviter d'exposer vos URLs de webhooks.
 * Copiez webhook-secrets.example.js vers webhook-secrets.js et remplissez vos valeurs.
 * 
 * @author ConnectFiber / Morellia
 * @date 2026-02-14
 */

// Configuration des webhooks n8n
window.WebhookConfig = {
    // Webhook pour extraction d'adresse SAR
    // Le PDF + métadonnées sont envoyés ici pour classement OneDrive
    sar_address: {
        url: 'https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction',
        
        // ⚠️ SÉCURITÉ : En production, NE PAS mettre le secret ici !
        // Utilisez un backend proxy qui ajoute le JWT
        // Pour dev/test uniquement :
        secret: '', // Laisser vide ou remplir pour dev uniquement
        
        // Timeout en millisecondes
        timeout: 30000,
        
        // Métadonnées supplémentaires
        metadata: {
            source: 'connectfiber-frontend',
            version: '1.0.0'
        }
    },
    
    // Webhook pour archivage des PDF de mandats Swisscom
    mandats_archive: {
        url: 'https://velox-n8n.yhmr4j.easypanel.host/webhook-test/b590df38-6d6b-47c6-9abc-5c4d554a6e00',
        secret: '', // Laisser vide ou remplir pour dev uniquement
        timeout: 60000
    }
};

/**
 * Génère un JWT pour authentifier les webhooks
 * ⚠️ Pour production, déplacer cette logique côté backend !
 * 
 * @param {string} secret - Secret JWT
 * @returns {string|null} JWT token ou null si pas de secret
 */
function generateWebhookJWT(secret) {
    if (!secret || secret === '') {
        console.warn('⚠️ [WEBHOOK] Aucun secret JWT configuré');
        return null;
    }
    
    if (typeof KJUR === 'undefined') {
        console.warn('⚠️ [WEBHOOK] Bibliothèque JWT non chargée');
        return null;
    }
    
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    };
    
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    
    return KJUR.jws.JWS.sign('HS256', sHeader, sPayload, secret);
}

/**
 * Envoie des données au webhook n8n de manière sécurisée
 * 
 * @param {string} webhookKey - Clé du webhook dans WebhookConfig
 * @param {FormData|Object} data - Données à envoyer
 * @returns {Promise<Object>} Réponse du webhook
 */
async function sendToWebhook(webhookKey, data) {
    const config = window.WebhookConfig[webhookKey];
    
    if (!config || !config.url) {
        throw new Error(`Webhook "${webhookKey}" non configuré`);
    }
    
    console.log(`📤 [WEBHOOK] Envoi vers ${webhookKey}:`, config.url);
    
    const headers = {};
    
    // Ajouter JWT si secret configuré
    if (config.secret && config.secret !== '') {
        const token = generateWebhookJWT(config.secret);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 [WEBHOOK] JWT ajouté');
        }
    } else {
        console.warn('⚠️ [WEBHOOK] Envoi SANS authentification JWT (dev only)');
    }
    
    // Préparer le body
    let body;
    let contentType = null;
    
    if (data instanceof FormData) {
        body = data;
        // Ne pas définir Content-Type pour FormData (navigateur le fait automatiquement)
    } else {
        body = JSON.stringify(data);
        contentType = 'application/json';
    }
    
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
    
    try {
        const response = await fetch(config.url, {
            method: 'POST',
            headers: headers,
            body: body,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        
        if (response.ok) {
            console.log('✅ [WEBHOOK] Envoi réussi:', response.status);
            try {
                return JSON.parse(responseText);
            } catch {
                return { success: true, response: responseText };
            }
        } else {
            console.error('❌ [WEBHOOK] Erreur:', response.status, responseText);
            throw new Error(`Webhook error: ${response.status}`);
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error('⏱️ [WEBHOOK] Timeout');
            throw new Error('Webhook timeout');
        }
        
        console.error('❌ [WEBHOOK] Erreur réseau:', error);
        throw error;
    }
}

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WebhookConfig,
        generateWebhookJWT,
        sendToWebhook
    };
}
