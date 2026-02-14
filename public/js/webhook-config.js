// Configuration des webhooks n8n (Backend Only)
// Ce fichier NE DOIT PAS être exposé au frontend
// À utiliser côté serveur uniquement via une API backend

const WEBHOOK_CONFIG = {
    // Webhook pour les mesures OTDR (PDFs)
    otdr: {
        url: process.env.N8N_WEBHOOK_OTDR_URL || 'https://votre-instance-n8n.com/webhook/otdr-upload',
        method: 'POST',
        headers: {
            'Authorization': process.env.N8N_WEBHOOK_AUTH || ''
        }
    },
    
    // Webhook pour les photos spéciales (OTDR sur fibre active + Routeur OK)
    specialPhotos: {
        url: process.env.N8N_WEBHOOK_SPECIAL_PHOTOS_URL || 'https://votre-instance-n8n.com/webhook/special-photos',
        method: 'POST',
        headers: {
            'Authorization': process.env.N8N_WEBHOOK_AUTH || ''
        }
    }
};

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEBHOOK_CONFIG;
}
