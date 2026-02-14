import requests
import json

# Test de l'API Ollama
url = "https://agtelecom-ollama.yhmr4j.easypanel.host/api/generate"

payload = {
    "model": "qwen2.5:3b",
    "prompt": "Extract the phone number from this text: Contact: +41 79 123 45 67. Answer with only the number.",
    "stream": False,
    "options": {
        "temperature": 0.1,
        "num_predict": 50
    }
}

print("🧪 Test de connexion à l'API Ollama...")
print(f"URL: {url}")
print(f"Model: {payload['model']}")
print("\n" + "="*50)

try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print("\n" + "="*50)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Succès!")
        print(f"\nRéponse complète:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if 'response' in result:
            print(f"\n📝 Texte extrait: {result['response']}")
        
    else:
        print(f"❌ Erreur HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.Timeout:
    print("❌ Timeout - L'API ne répond pas dans les 30 secondes")
except requests.ConnectionError as e:
    print(f"❌ Erreur de connexion: {e}")
except Exception as e:
    print(f"❌ Erreur: {e}")
