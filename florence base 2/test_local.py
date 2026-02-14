"""
Script de test local pour Florence-2
Permet de tester l'image Docker avant de la publier
"""

import base64
import json
import requests
from PIL import Image
import io

def image_to_base64(image_path):
    """Convertit une image en base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def test_florence2_local(image_path, task="<DETAILED_CAPTION>", url="http://localhost:8000/runsync"):
    """
    Teste le modèle Florence-2 localement
    
    Args:
        image_path: Chemin vers l'image à tester
        task: Type de tâche à effectuer
        url: URL du serveur local
    """
    print(f"🖼️  Test de l'image: {image_path}")
    print(f"📋 Tâche: {task}")
    
    # Convertir l'image en base64
    try:
        image_base64 = image_to_base64(image_path)
        print("✅ Image convertie en base64")
    except Exception as e:
        print(f"❌ Erreur lors de la conversion: {e}")
        return
    
    # Préparer la requête
    payload = {
        "input": {
            "image": image_base64,
            "task": task,
            "text_prompt": ""
        }
    }
    
    # Envoyer la requête
    try:
        print(f"📤 Envoi de la requête à {url}...")
        response = requests.post(url, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Réponse reçue:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de requête: {e}")
        print("\n💡 Assurez-vous que le conteneur Docker est en cours d'exécution:")
        print("   docker run --gpus all -p 8000:8000 florence-2-runpod:latest")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python test_local.py <image_path> [task]")
        print("\nTâches disponibles:")
        print("  <DETAILED_CAPTION> - Description détaillée (par défaut)")
        print("  <CAPTION> - Description courte")
        print("  <OBJECT_DETECTION> - Détection d'objets")
        print("  <OCR> - Reconnaissance optique de caractères")
        sys.exit(1)
    
    image_path = sys.argv[1]
    task = sys.argv[2] if len(sys.argv) > 2 else "<DETAILED_CAPTION>"
    
    test_florence2_local(image_path, task)

