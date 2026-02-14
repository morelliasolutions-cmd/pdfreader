#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test pour le service d'extraction d'adresse SAR
Crée un PDF de test et vérifie l'extraction

Auteur: ConnectFiber / Morellia
Date: 2026-02-14
"""

import requests
import tempfile
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_test_pdf():
    """
    Crée un PDF de test avec une adresse SAR
    """
    print("📄 Création d'un PDF de test...")
    
    # Créer un fichier temporaire
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_path = temp_file.name
    temp_file.close()
    
    # Créer le PDF
    c = canvas.Canvas(temp_path, pagesize=A4)
    width, height = A4
    
    # Ajouter du contenu
    c.setFont("Helvetica", 12)
    
    # Titre
    c.drawString(100, height - 100, "Document SAR - Test")
    c.drawString(100, height - 120, "================================")
    
    # Section adresse
    c.drawString(100, height - 180, "Informations du site :")
    c.drawString(100, height - 200, "")
    c.drawString(100, height - 220, "Libellé d'adresse :")
    c.drawString(100, height - 240, "av. du Simplon 4A")
    c.drawString(100, height - 260, "1870 Monthey")
    
    # Autres informations
    c.drawString(100, height - 300, "")
    c.drawString(100, height - 320, "Autres informations techniques...")
    c.drawString(100, height - 340, "Type de raccordement : Fibre optique")
    c.drawString(100, height - 360, "Date d'installation prévue : 15/03/2026")
    
    c.save()
    
    print(f"✅ PDF de test créé : {temp_path}")
    return temp_path


def test_extraction(pdf_path):
    """
    Test l'extraction d'adresse depuis le PDF de test
    """
    print("\n🧪 Test de l'API d'extraction...")
    
    # URL de l'API
    url = "http://localhost:5001/api/extract-sar-address"
    
    try:
        # Envoyer le PDF à l'API
        with open(pdf_path, 'rb') as f:
            files = {'pdfs': (os.path.basename(pdf_path), f, 'application/pdf')}
            response = requests.post(url, files=files, timeout=10)
        
        # Vérifier la réponse
        if response.status_code == 200:
            data = response.json()
            
            print("\n✅ Extraction réussie !")
            print(f"   Success: {data.get('success')}")
            print(f"   Count: {data.get('count')}")
            print(f"   Success count: {data.get('success_count')}")
            
            if data.get('results'):
                for result in data['results']:
                    print(f"\n📋 Résultat pour {result.get('file_name')}:")
                    print(f"   Success: {result.get('success')}")
                    
                    if result.get('success'):
                        result_data = result.get('data', {})
                        print(f"   📍 Adresse: {result_data.get('address')}")
                        print(f"   📮 NPA: {result_data.get('npa')}")
                        print(f"   🏘️  Commune: {result_data.get('commune')}")
                        print(f"   📄 Page: {result.get('page')}")
                        
                        # Vérifier que les valeurs sont correctes
                        if (result_data.get('address') == 'av. du Simplon 4A' and
                            result_data.get('npa') == '1870' and
                            result_data.get('commune') == 'Monthey'):
                            print("\n   ✅ Toutes les valeurs sont correctes !")
                            return True
                        else:
                            print("\n   ⚠️  Les valeurs extraites ne correspondent pas aux valeurs attendues")
                            return False
                    else:
                        print(f"   ❌ Erreur: {result.get('error')}")
                        return False
            
            return False
        else:
            print(f"\n❌ Erreur HTTP {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Impossible de se connecter au serveur")
        print("   Assurez-vous que le serveur est démarré sur le port 5001")
        print("   Commande: python extract_sar_address.py")
        return False
    except requests.exceptions.Timeout:
        print("\n❌ Timeout : Le serveur ne répond pas dans le temps imparti")
        return False
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {str(e)}")
        return False


def test_health():
    """
    Test l'endpoint de santé du service
    """
    print("\n🏥 Test du health check...")
    
    url = "http://localhost:5001/api/health"
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service en bonne santé !")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Statut inattendu: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Service non accessible")
        return False
    except Exception as e:
        print(f"❌ Erreur : {str(e)}")
        return False


def main():
    """
    Fonction principale de test
    """
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║  🧪 Test du service d'extraction d'adresse SAR               ║")
    print("╚═══════════════════════════════════════════════════════════════╝\n")
    
    # Test 1 : Health check
    health_ok = test_health()
    
    if not health_ok:
        print("\n⚠️  Le service ne semble pas être démarré")
        print("   Démarrez-le avec : python extract_sar_address.py")
        return
    
    # Test 2 : Création du PDF et extraction
    pdf_path = None
    try:
        pdf_path = create_test_pdf()
        extraction_ok = test_extraction(pdf_path)
        
        print("\n" + "="*60)
        if extraction_ok:
            print("✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !")
        else:
            print("❌ CERTAINS TESTS ONT ÉCHOUÉ")
        print("="*60)
        
    finally:
        # Nettoyer le fichier temporaire
        if pdf_path and os.path.exists(pdf_path):
            os.unlink(pdf_path)
            print(f"\n🗑️  PDF de test supprimé : {pdf_path}")


if __name__ == '__main__':
    # Vérifier que reportlab est installé
    try:
        import reportlab
    except ImportError:
        print("❌ La bibliothèque 'reportlab' n'est pas installée")
        print("   Installez-la avec : pip install reportlab")
        exit(1)
    
    main()
