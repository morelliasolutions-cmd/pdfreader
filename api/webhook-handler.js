// API Backend pour gérer les webhooks n8n (sécurisé)
// Ce fichier doit être exécuté côté serveur UNIQUEMENT

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Endpoint pour uploader les PDFs OTDR vers n8n
router.post('/upload-otdr', upload.single('file'), async (req, res) => {
    try {
        const { otdr_number, intervention_id, employee_id, timestamp } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }
        
        // Préparer les données pour n8n
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        formData.append('otdr_number', otdr_number);
        formData.append('intervention_id', intervention_id);
        formData.append('employee_id', employee_id);
        formData.append('timestamp', timestamp);
        
        // Envoyer vers le webhook n8n (URL sécurisée)
        const webhookUrl = process.env.N8N_WEBHOOK_OTDR_URL;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(),
                'Authorization': process.env.N8N_WEBHOOK_AUTH || ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`Webhook n8n erreur: ${response.status}`);
        }
        
        const result = await response.json();
        
        res.json({
            success: true,
            message: 'OTDR envoyé avec succès',
            data: result
        });
        
    } catch (error) {
        console.error('Erreur upload OTDR:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint pour uploader les photos spéciales vers n8n
router.post('/upload-special-photo', upload.single('file'), async (req, res) => {
    try {
        const { photo_id, photo_type, intervention_id, employee_id, timestamp } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }
        
        // Préparer les données pour n8n
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        formData.append('photo_id', photo_id);
        formData.append('photo_type', photo_type);
        formData.append('intervention_id', intervention_id);
        formData.append('employee_id', employee_id);
        formData.append('timestamp', timestamp);
        
        // Envoyer vers le webhook n8n (URL sécurisée)
        const webhookUrl = process.env.N8N_WEBHOOK_SPECIAL_PHOTOS_URL;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(),
                'Authorization': process.env.N8N_WEBHOOK_AUTH || ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`Webhook n8n erreur: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Le webhook n8n devrait retourner la note IA
        res.json({
            success: true,
            message: 'Photo spéciale envoyée avec succès',
            ai_score: result.ai_score || null,
            ai_comment: result.ai_comment || null,
            data: result
        });
        
    } catch (error) {
        console.error('Erreur upload photo spéciale:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
