/**
 * Serveur API local pour analyse PDF de mandats
 * Utilise Express + Multer pour upload et traitement
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const pdfAnalysisRoutes = require('./pdf-analysis-routes');

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logs des requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api', pdfAnalysisRoutes);

// Route de test
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({
        error: 'Erreur serveur',
        message: err.message
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`);
    console.log(`📄 Endpoint PDF: http://localhost:${PORT}/api/analyze-pdf`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
