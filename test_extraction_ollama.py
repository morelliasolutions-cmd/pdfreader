import requests
import json

# Test du modèle qwen2.5:1.5b avec extraction de données
url = "https://agtelecom-ollama.yhmr4j.easypanel.host/api/generate"

# Texte de test simulant un PDF de mandat
test_text = """
SWISSCOM FTTH Installation Order

Disp ID: 123456789
Socket Label: B.1234.56.78.9
Customer: Jean Dupont
Address: Rue de la Gare 15, 1003 Lausanne
Phone: +41 79 123 45 67
Email: jean.dupont@example.com

Cable Information:
Cable: FO-CABLE-XYZ-2024
SP1: 12
SP2: 15
SP3: 18
SP4: 21
"""

prompt = f"""Tu es un assistant d'extraction de données de mandats de fibre optique Swisscom. Analyse le texte suivant et extrait les informations structurées.

Texte du document:
{test_text}

Instructions:
- Extrais UNIQUEMENT les informations présentes dans le texte
- Ne devine pas, ne fabrique pas de données
- Retourne un objet JSON valide avec ces champs (null si non trouvé):
  * mandate_number: numéro du mandat/Disp ID
  * socket_label: référence PTO/Socket (format B.xxx.xx.xx.x)
  * cable: nom du câble d'alimentation
  * fiber_1, fiber_2, fiber_3, fiber_4: numéros de fibres (SP1, SP2, SP3, SP4)
  * phone: numéro de téléphone (format +41...)
  * email: adresse email du contact
  * address: adresse complète du site
  * client_name: nom du client

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire."""

payload = {
    "model": "qwen2.5:1.5b",
    "prompt": prompt,
    "stream": False,
    "options": {
        "temperature": 0.1,
        "top_p": 0.9,
        "num_predict": 500
    }
}

print("🧪 Test d'extraction avec qwen2.5:1.5b...")
print("="*60)

try:
    response = requests.post(url, json=payload, timeout=60)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Succès!")
        print(f"\n📊 Statistiques:")
        print(f"  - Total duration: {result.get('total_duration', 0) / 1e9:.2f}s")
        print(f"  - Load duration: {result.get('load_duration', 0) / 1e9:.2f}s")
        print(f"  - Prompt eval count: {result.get('prompt_eval_count', 0)}")
        print(f"  - Eval count: {result.get('eval_count', 0)}")
        
        ai_response = result.get('response', '').strip()
        print(f"\n📝 Réponse brute de l'IA:")
        print("-" * 60)
        print(ai_response)
        print("-" * 60)
        
        # Tenter d'extraire le JSON
        import re
        json_match = re.search(r'\{[^}]*\}', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            try:
                extracted_data = json.loads(json_str)
                print(f"\n✅ JSON parsé avec succès:")
                print(json.dumps(extracted_data, indent=2, ensure_ascii=False))
            except json.JSONDecodeError as e:
                print(f"\n❌ Erreur parsing JSON: {e}")
                print(f"JSON brut: {json_str}")
        else:
            print("\n❌ Pas de JSON trouvé dans la réponse")
        
    else:
        print(f"❌ Erreur HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.Timeout:
    print("❌ Timeout - L'API ne répond pas dans les 60 secondes")
except Exception as e:
    print(f"❌ Erreur: {e}")
