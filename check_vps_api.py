import requests
import json

# Vérifier l'état de l'API VPS
api_url = "https://velox-pdfswisscom.yhmr4j.easypanel.host"

print("🔍 Vérification de l'état de l'API VPS...")
print(f"URL: {api_url}")
print("="*60)

# Test 1: Health check
print("\n1️⃣ Test Health Check...")
try:
    response = requests.get(f"{api_url}/health", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✅ {response.json()}")
    else:
        print(f"   ❌ {response.text}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

# Test 2: Options (CORS preflight)
print("\n2️⃣ Test CORS Preflight (OPTIONS)...")
try:
    response = requests.options(f"{api_url}/api/analyze-pdf", timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Headers CORS:")
    cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower() or 'origin' in k.lower()}
    if cors_headers:
        for k, v in cors_headers.items():
            print(f"      {k}: {v}")
    else:
        print("      ❌ Aucun header CORS trouvé")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

# Test 3: POST sans fichier (pour voir la réponse)
print("\n3️⃣ Test POST simple...")
try:
    response = requests.post(f"{api_url}/api/analyze-pdf", timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n" + "="*60)
print("💡 Si le service ne répond pas (502/503), il faut le redémarrer sur le VPS")
print("   Commande SSH: ssh -i ssh.key root@vps && docker restart <container_name>")
