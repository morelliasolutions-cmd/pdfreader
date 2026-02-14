/**
 * API Endpoint pour analyser les PDF de mandats
 * Utilise le script Python analyze_mandate_pdf.py
 */

const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const router = express.Router();

// Configuration multer pour upload de fichiers
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'));
        }
    }
});

/**
 * POST /api/analyze-pdf
 * Analyse un ou plusieurs PDF de mandats
 * Body: multipart/form-data avec fichiers PDF
 * Response: Array d'objets avec données extraites
 */
router.post('/analyze-pdf', upload.array('pdfs', 10), async (req, res) => {
    const results = [];
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
        }

        // Analyser chaque PDF
        for (const file of req.files) {
            try {
                const analysis = await analyzePdfFile(file.path);
                results.push({
                    originalName: file.originalname,
                    ...analysis
                });
            } catch (error) {
                results.push({
                    originalName: file.originalname,
                    success: false,
                    error: error.message
                });
            } finally {
                // Supprimer le fichier temporaire
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Erreur suppression fichier temp:', unlinkError);
                }
            }
        }

        res.json({
            success: true,
            count: results.length,
            results
        });

    } catch (error) {
        console.error('Erreur analyse PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'analyse des PDF'
        });
    }
});

/**
 * Analyse un fichier PDF avec le script Python strict
 * @param {string} filePath - Chemin du fichier PDF
 * @returns {Promise<Object>} Données extraites
 */
async function analyzePdfFile(filePath) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'analyze_mandate_pdf_strict.py');
        const pythonProcess = spawn('python', [scriptPath, filePath]);
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script error: ${stderr}`));
                return;
            }
            
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                reject(new Error(`JSON parse error: ${parseError.message}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            reject(new Error(`Python execution error: ${error.message}`));
        });
    });
}

/**
 * ANCIENNE VERSION avec LM Studio - conservée pour référence
 */
async function analyzePdfFileWithIA(filePath) {
    try {
        // 1. Extraire le texte du PDF (première page) avec pdfplumber
        const pdfText = await extractPdfText(filePath);
        
        // 2. Créer le prompt pour LM Studio
        const prompt = `Tu es un assistant d'extraction de données techniques de PDF de mandats FTTH.
Analyse le texte suivant et extrait UNIQUEMENT ces informations au format JSON strict :

{
  "mandate_number": "numéro du Disp ID (8 chiffres minimum)",
  "socket_label": "format B.XXX.XXX.XXX.X si présent",
  "cable": "nom du câble (ex: FSC09 - 53fi3 ou FTTH 32 FSP0fk290o-22)",
  "fiber_1": "CHIFFRE UNIQUEMENT dans la colonne SP1 du tableau (ex: 6, 36, pas SP1)",
  "fiber_2": "CHIFFRE UNIQUEMENT dans la colonne SP2 du tableau",
  "fiber_3": "CHIFFRE UNIQUEMENT dans la colonne SP3 du tableau",
  "fiber_4": "CHIFFRE UNIQUEMENT dans la colonne SP4 du tableau"
}

IMPORTANT pour les fibres:
- Cherche un TABLEAU avec colonnes "Fibre Access" contenant SP1, SP2, SP3, SP4
- Extrais les VALEURS NUMÉRIQUES sous chaque colonne (pas les en-têtes SP1/SP2/SP3/SP4)
- Si la cellule est vide ou ne contient pas de chiffre, mets null
- Les fibres doivent être des NOMBRES PURS (6, 36, 42, etc), PAS "SP1", "SP2", etc

Si une donnée n'est pas trouvée, mets null. Ne retourne RIEN d'autre que le JSON.

TEXTE DU PDF:
${pdfText}`;

        // 3. Appeler LM Studio
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen/qwen2.5-vl-7b',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un expert en extraction de données JSON. Tu réponds UNIQUEMENT en JSON valide, sans explication.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 500,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`LM Studio erreur: ${response.status}`);
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices[0].message.content;
        
        // 4. Parser la réponse JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Pas de JSON dans la réponse IA');
        }
        
        const extractedData = JSON.parse(jsonMatch[0]);
        
        return {
            success: true,
            file_name: path.basename(filePath),
            data: {
                mandate_number: extractedData.mandate_number,
                socket_label: extractedData.socket_label,
                cable: extractedData.cable,
                fiber_1: extractedData.fiber_1,
                fiber_2: extractedData.fiber_2,
                fiber_3: extractedData.fiber_3,
                fiber_4: extractedData.fiber_4
            }
        };

    } catch (error) {
        return {
            success: false,
            file_name: path.basename(filePath),
            error: error.message
        };
    }
}

/**
 * Extrait le texte de la première page d'un PDF avec pdfplumber
 * @param {string} filePath - Chemin du PDF
 * @returns {Promise<string>} Texte extrait
 */
function extractPdfText(filePath) {
    return new Promise((resolve, reject) => {
        const pythonCode = `
import pdfplumber
import sys

try:
    with pdfplumber.open(sys.argv[1]) as pdf:
        if len(pdf.pages) > 0:
            text = pdf.pages[0].extract_text()
            print(text)
        else:
            print("")
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;
        
        const pythonProcess = spawn('python', ['-c', pythonCode, filePath]);
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Extraction PDF erreur: ${stderr}`));
            } else {
                resolve(stdout);
            }
        });
    });
}

module.exports = router;
