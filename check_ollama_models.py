import requests
import json

# Lister les modèles disponibles sur Ollama
url = "https://agtelecom-ollama.yhmr4j.easypanel.host/api/tags"

print("🔍 Recherche des modèles disponibles sur Ollama...")
print(f"URL: {url}")
print("\n" + "="*50)

try:
    response = requests.get(url, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Succès!")
        print(f"\nModèles disponibles:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if 'models' in result:
            print(f"\n📋 Liste des modèles:")
            for model in result['models']:
                print(f"  - {model.get('name', 'N/A')}")
        
    else:
        print(f"❌ Erreur HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Erreur: {e}")

# Test avec différents noms de modèles courants
print("\n" + "="*50)
print("🧪 Test de modèles courants...\n")

test_models = [
    "qwen2.5:3b",
    "qwen2.5",
    "qwen2:3b",
    "qwen:3b",
    "llama2",
    "mistral"
]

for model_name in test_models:
    try:
        payload = {
            "model": model_name,
            "prompt": "Test",
            "stream": False,
            "options": {"num_predict": 5}
        }
        response = requests.post(
            "https://agtelecom-ollama.yhmr4j.easypanel.host/api/generate",
            json=payload,
            timeout=10
        )
        if response.status_code == 200:
            print(f"✅ {model_name} - DISPONIBLE")
        else:
            print(f"❌ {model_name} - {response.status_code}")
    except Exception as e:
        print(f"❌ {model_name} - Erreur: {str(e)[:50]}")
