#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Service d'extraction d'adresse depuis les fichiers SAR PDF
Utilise pdfplumber pour extraire les informations d'adresse structurées

Format attendu dans le PDF :
  Libellé d'adresse :
  av. du Simplon 4A
  1870 Monthey

Auteur: ConnectFiber / Morellia
Date: 2026-02-14
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import re
import io
import logging
import os
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Charger les variables d'environnement depuis .env
load_dotenv()

# Configuration du logging
log_level = os.getenv('LOG_LEVEL', 'INFO')
log_format = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')

logging.basicConfig(
    level=getattr(logging, log_level),
    format=log_format
)
logger = logging.getLogger(__name__)

# Initialisation Flask
app = Flask(__name__)

# Configuration CORS depuis .env
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=allowed_origins)

# Configuration depuis .env
SAR_PORT = int(os.getenv('SAR_EXTRACTION_PORT', 5001))
SAR_HOST = os.getenv('SAR_EXTRACTION_HOST', '0.0.0.0')
SAR_DEBUG = os.getenv('SAR_EXTRACTION_DEBUG', 'False').lower() == 'true'
SAR_PUBLIC_URL = os.getenv('SAR_EXTRACTION_PUBLIC_URL', 'http://localhost:5001')
MAX_UPLOAD_SIZE_MB = int(os.getenv('MAX_UPLOAD_SIZE_MB', 50))
EXTRACTION_TIMEOUT = int(os.getenv('EXTRACTION_TIMEOUT_SECONDS', 60))

# Webhook N8N pour envoi des adresses extraites
N8N_WEBHOOK_SAR_URL = os.getenv('N8N_WEBHOOK_SAR_ADDRESS_URL', '')
N8N_WEBHOOK_SAR_SECRET = os.getenv('N8N_WEBHOOK_SAR_SECRET', '')

# Configuration taille max des uploads
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE_MB * 1024 * 1024

logger.info(f"🔧 Configuration chargée depuis .env")
logger.info(f"   Port: {SAR_PORT}")
logger.info(f"   Host: {SAR_HOST}")
logger.info(f"   Debug: {SAR_DEBUG}")
logger.info(f"   CORS origins: {allowed_origins}")
logger.info(f"   Max upload: {MAX_UPLOAD_SIZE_MB}MB")
logger.info(f"   Webhook configuré: {'Oui' if N8N_WEBHOOK_SAR_URL else 'Non'}")


def extract_address_from_sar_pdf(pdf_bytes: bytes, filename: str) -> Dict:
    """
    Extrait l'adresse, le NPA et la commune depuis un fichier SAR PDF
    
    Args:
        pdf_bytes: Contenu du PDF en bytes
        filename: Nom du fichier pour le logging
        
    Returns:
        Dict avec success, data (address, npa, commune) ou error
    """
    try:
        logger.info(f"📄 Traitement du fichier: {filename}")
        
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            # Parcourir toutes les pages
            for page_num, page in enumerate(pdf.pages, 1):
                logger.info(f"  📖 Analyse de la page {page_num}")
                
                # Extraire le texte de la page
                text = page.extract_text()
                
                if not text:
                    logger.warning(f"  ⚠️ Page {page_num} vide ou illisible")
                    continue
                
                # Chercher le pattern "Libellé d'adresse :"
                # Le texte est organisé ligne par ligne
                lines = text.split('\n')
                
                for i, line in enumerate(lines):
                    # Recherche du pattern (insensible à la casse et espaces)
                    # Utiliser des guillemets doubles pour éviter les conflits d'apostrophes
                    if re.search(r"libell[eé]\s+d['’]adresse\s*:", line.lower()):
                        logger.info(f"  ✅ Pattern trouvé à la ligne {i}")
                        
                        # Extraire les 3 lignes suivantes
                        # Ligne 1: Adresse (ex: "av. du Simplon 4A")
                        # Ligne 2: NPA + Commune (ex: "1870 Monthey")
                        
                        if i + 2 < len(lines):
                            address_line = lines[i + 1].strip()
                            npa_commune_line = lines[i + 2].strip()
                            
                            logger.info(f"  📍 Adresse brute: {address_line}")
                            logger.info(f"  📍 NPA/Commune brute: {npa_commune_line}")
                            
                            # Parser la ligne NPA + Commune
                            # Format attendu: "1870 Monthey" ou "187000 Monthey"
                            npa_commune_match = re.match(r'^(\d{4,6})\s+(.+)$', npa_commune_line)
                            
                            if npa_commune_match:
                                npa = npa_commune_match.group(1).strip()
                                commune = npa_commune_match.group(2).strip()
                                
                                # Nettoyer le NPA (garder seulement 4 chiffres si 6 sont présents)
                                if len(npa) > 4:
                                    npa = npa[:4]
                                
                                result = {
                                    'success': True,
                                    'data': {
                                        'address': address_line,
                                        'npa': npa,
                                        'commune': commune
                                    },
                                    'page': page_num
                                }
                                
                                logger.info(f"  ✅ Extraction réussie: {result['data']}")
                                return result
                            else:
                                logger.warning(f"  ⚠️ Format NPA/Commune non reconnu: {npa_commune_line}")
                        else:
                            logger.warning(f"  ⚠️ Pas assez de lignes après le pattern")
        
        # Si on arrive ici, le pattern n'a pas été trouvé
        logger.error(f"  ❌ Pattern 'Libellé d\\'adresse' introuvable dans {filename}")
        return {
            'success': False,
            'error': 'Pattern "Libellé d\'adresse" introuvable dans le PDF'
        }
        
    except Exception as e:
        logger.error(f"  ❌ Erreur lors de l'extraction: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': f'Erreur lors de l\'extraction: {str(e)}'
        }


@app.route('/api/extract-sar-address', methods=['POST'])
def extract_sar_address():
    """
    Endpoint pour extraire les adresses depuis un ou plusieurs fichiers SAR PDF
    
    Accepte multipart/form-data avec un ou plusieurs fichiers PDF sous la clé 'pdfs'
    
    Returns:
        JSON avec success, results (liste des extractions) et count
    """
    try:
        logger.info("🔄 Nouvelle requête d'extraction SAR")
        
        # Vérifier qu'il y a des fichiers
        if 'pdfs' not in request.files:
            logger.error("❌ Aucun fichier fourni")
            return jsonify({
                'success': False,
                'error': 'Aucun fichier fourni'
            }), 400
        
        files = request.files.getlist('pdfs')
        
        if not files or len(files) == 0:
            logger.error("❌ Liste de fichiers vide")
            return jsonify({
                'success': False,
                'error': 'Liste de fichiers vide'
            }), 400
        
        logger.info(f"📥 {len(files)} fichier(s) reçu(s)")
        
        results = []
        
        # Traiter chaque fichier
        for file in files:
            filename = file.filename
            logger.info(f"--- Traitement de {filename} ---")
            
            # Lire le contenu du fichier
            pdf_bytes = file.read()
            
            # Extraire l'adresse
            extraction_result = extract_address_from_sar_pdf(pdf_bytes, filename)
            
            # Ajouter le nom du fichier au résultat
            extraction_result['file_name'] = filename
            
            results.append(extraction_result)
        
        # Compter les succès
        success_count = sum(1 for r in results if r.get('success', False))
        
        logger.info(f"✅ Extraction terminée: {success_count}/{len(results)} réussies")
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'success_count': success_count
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur serveur: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Erreur serveur: {str(e)}'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de santé pour vérifier que le service est actif"""
    return jsonify({
        'status': 'healthy',
        'service': 'SAR Address Extraction',
        'version': '1.0.0',
        'max_upload_mb': MAX_UPLOAD_SIZE_MB,
        'extraction_timeout_seconds': EXTRACTION_TIMEOUT
    })


@app.route('/api/config', methods=['GET'])
def get_config():
    """
    Endpoint pour récupérer la configuration publique
    
    ⚠️ SÉCURITÉ : Ne JAMAIS exposer les secrets (JWT, etc.)
    Retourne uniquement les URLs publiques nécessaires au frontend
    
    Conforme à AGENTS.md : Pas de secrets exposés
    """
    return jsonify({
        'service': 'SAR Address Extraction',
        'version': '1.0.0',
        'endpoints': {
            'extract': f'{SAR_PUBLIC_URL}/api/extract-sar-address',
            'save': f'{SAR_PUBLIC_URL}/api/save-sar',
            'health': f'{SAR_PUBLIC_URL}/api/health'
        },
        'limits': {
            'max_upload_mb': MAX_UPLOAD_SIZE_MB,
            'extraction_timeout_seconds': EXTRACTION_TIMEOUT
        },
        'webhook_configured': bool(N8N_WEBHOOK_SAR_URL)
    })


@app.route('/api/save-sar', methods=['POST'])
def save_sar_to_onedrive():
    """
    Endpoint PROXY vers le webhook n8n pour sauvegarder les fichiers SAR sur OneDrive
    
    🔒 SÉCURITÉ : Cet endpoint agit comme proxy sécurisé
    - Le frontend envoie les données + PDF ici
    - Le backend ajoute le JWT secret depuis .env
    - Le backend transmet à n8n de manière sécurisée
    - Le webhook URL et JWT ne sont JAMAIS exposés au frontend
    
    ✅ Conforme à AGENTS.md : Secrets côté backend uniquement
    
    Accepte multipart/form-data avec :
    - 'data': JSON stringifié avec {address, npa, commune, file_name}
    - 'pdf': Le fichier PDF original
    
    Returns:
        JSON avec success et message
    """
    try:
        logger.info("🔄 Nouvelle requête d'enregistrement SAR vers OneDrive")
        
        # Vérifier que le webhook est configuré
        if not N8N_WEBHOOK_SAR_URL:
            logger.error("❌ Webhook n8n non configuré dans .env")
            return jsonify({
                'success': False,
                'error': 'Webhook non configuré sur le serveur'
            }), 500
        
        # Récupérer les données JSON
        if 'data' not in request.form:
            logger.error("❌ Données manquantes")
            return jsonify({
                'success': False,
                'error': 'Données manquantes (champ data requis)'
            }), 400
        
        # Récupérer le fichier PDF
        if 'pdf' not in request.files:
            logger.error("❌ Fichier PDF manquant")
            return jsonify({
                'success': False,
                'error': 'Fichier PDF manquant'
            }), 400
        
        import json
        data = json.loads(request.form['data'])
        pdf_file = request.files['pdf']
        
        logger.info(f"📥 Données reçues: {data}")
        logger.info(f"📄 Fichier: {pdf_file.filename}")
        
        # Préparer les données pour n8n
        # n8n recevra : données JSON + fichier PDF + JWT dans headers
        files = {
            'pdf': (pdf_file.filename, pdf_file.read(), 'application/pdf')
        }
        
        # Préparer les headers avec le JWT (secret sécurisé)
        headers = {}
        if N8N_WEBHOOK_SAR_SECRET:
            headers['Authorization'] = f'Bearer {N8N_WEBHOOK_SAR_SECRET}'
            logger.info("🔐 JWT ajouté aux headers (secret sécurisé)")
        
        # Données à envoyer en form-data
        form_data = {
            'address': data.get('address', ''),
            'npa': data.get('npa', ''),
            'commune': data.get('commune', ''),
            'file_name': data.get('file_name', '')
        }
        
        logger.info(f"🌐 Envoi vers webhook n8n...")
        
        # Appeler le webhook n8n de manière sécurisée
        response = requests.post(
            N8N_WEBHOOK_SAR_URL,
            files=files,
            data=form_data,
            headers=headers,
            timeout=30
        )
        
        # Vérifier la réponse
        if response.status_code == 200:
            logger.info(f"✅ Fichier envoyé avec succès vers OneDrive")
            return jsonify({
                'success': True,
                'message': 'Fichier enregistré sur OneDrive avec succès'
            })
        else:
            logger.error(f"❌ Erreur webhook n8n: {response.status_code} - {response.text}")
            return jsonify({
                'success': False,
                'error': f'Erreur lors de l\'envoi: {response.status_code}'
            }), 500
            
    except json.JSONDecodeError as e:
        logger.error(f"❌ Erreur parsing JSON: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Format JSON invalide'
        }), 400
    except requests.exceptions.Timeout:
        logger.error("❌ Timeout lors de l'envoi vers n8n")
        return jsonify({
            'success': False,
            'error': 'Timeout lors de l\'envoi'
        }), 504
    except Exception as e:
        logger.error(f"❌ Erreur serveur: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Erreur serveur: {str(e)}'
        }), 500


if __name__ == '__main__':
    logger.info("🚀 Démarrage du serveur d'extraction SAR")
    logger.info(f"   📡 Port: {SAR_PORT}")
    logger.info(f"   🌐 Host: {SAR_HOST}")
    logger.info(f"   🔍 Mode debug: {SAR_DEBUG}")
    logger.info("🔐 Sécurité : Variables d'environnement chargées depuis .env")
    logger.info("✅ Prêt à extraire des adresses depuis les fichiers SAR PDF")
    
    # Démarrer le serveur avec la config depuis .env
    app.run(host=SAR_HOST, port=SAR_PORT, debug=SAR_DEBUG)
