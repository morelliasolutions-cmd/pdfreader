# 🤖 Analyse OTDR avec LM Studio (IA locale)

Script Python pour extraire les données d'un PDF OTDR et les analyser avec LM Studio.

## 🚀 Installation

```bash
pip install pdfplumber requests
```

## 📋 Prérequis

1. **LM Studio installé et lancé**
   - Télécharger: https://lmstudio.ai/
   - Charger un modèle (ex: Llama 3.2 3B Instruct)
   - Démarrer le serveur local (Server → Start Server)

2. **Vérifier que le serveur est actif:**
   ```bash
   curl http://127.0.0.1:1234/v1/models
   ```

## 🎯 Utilisation

### Commande basique

```bash
python analyze_otdr_with_lmstudio.py rapport_otdr.pdf
```

### Spécifier un modèle

```bash
python analyze_otdr_with_lmstudio.py rapport_otdr.pdf llama-3.2-3b-instruct
```

## 📊 Ce que le script fait

1. **Extrait les données du PDF** (texte + tableaux)
2. **Formate les données** pour l'analyse IA
3. **Envoie à LM Studio** via l'API locale
4. **Reçoit l'analyse** avec:
   - Score de qualité /10
   - Données techniques (longueur, atténuation, etc.)
   - Problèmes détectés
   - Recommandations
5. **Sauvegarde le résultat** en JSON

## 📤 Format de sortie

Le script génère un fichier `rapport_otdr.analysis.json`:

```json
{
  "file": "rapport_otdr.pdf",
  "model": "llama-3.2-3b-instruct",
  "analysis": {
    "score": 8.5,
    "status": "excellent",
    "fiber_length_km": "2.45",
    "total_attenuation_db": "0.85",
    "wavelength_nm": "1550",
    "num_events": 5,
    "issues": ["Légère perte sur épissure 3"],
    "recommendations": ["Vérifier la qualité de l'épissure"],
    "summary": "Mesure OTDR de bonne qualité avec une atténuation acceptable."
  }
}
```

## 🔧 Configuration

### Changer l'URL de LM Studio

Modifiez la ligne dans le script:

```python
LM_STUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions"
```

### Changer le prompt système

Modifiez la variable `system_prompt` dans la fonction `analyze_with_lmstudio()` pour adapter l'analyse à vos besoins.

## 💡 Exemples

### Exemple 1: Analyse simple

```bash
python analyze_otdr_with_lmstudio.py test_otdr.pdf
```

**Sortie:**
```
======================================================================
📄 Analyse OTDR avec IA locale
======================================================================
Fichier: test_otdr.pdf
Modèle IA: llama-3.2-3b-instruct
LM Studio: http://127.0.0.1:1234/v1/chat/completions
======================================================================

📊 ÉTAPE 1: Extraction des données du PDF...
   ✅ 3 page(s) extraite(s)
   ✅ 2 tableau(x) détecté(s)
   ✅ 4521 caractères de texte

📝 ÉTAPE 2: Formatage des données pour l'IA...
   ✅ Données formatées (5234 caractères)

🤖 ÉTAPE 3: Analyse avec LM Studio...
🤖 Envoi à LM Studio pour analyse...

======================================================================
⭐ RÉSULTATS DE L'ANALYSE
======================================================================

✅ Score: 8.5/10
📊 Statut: EXCELLENT

🔧 DONNÉES TECHNIQUES:
   - Longueur fibre: 2.45 km
   - Atténuation totale: 0.85 dB
   - Longueur d'onde: 1550 nm
   - Événements détectés: 5

📋 RÉSUMÉ:
   Mesure OTDR de bonne qualité avec une atténuation acceptable.

💾 Résultats sauvegardés: test_otdr.analysis.json

======================================================================
✅ Analyse terminée!
======================================================================
```

### Exemple 2: Batch processing

```bash
# Analyser tous les PDFs d'un dossier
for file in *.pdf; do
    python analyze_otdr_with_lmstudio.py "$file"
done
```

### Exemple 3: Utilisation dans Python

```python
from analyze_otdr_with_lmstudio import extract_otdr_text, format_data_for_analysis, analyze_with_lmstudio

# Extraire
data = extract_otdr_text("rapport.pdf")

# Formater
formatted = format_data_for_analysis(data)

# Analyser
analysis = analyze_with_lmstudio(formatted)

print(f"Score: {analysis['score']}/10")
```

## 🔗 Intégration n8n

### Node 1: Webhook (réception PDF)
```
Reçoit le PDF depuis l'app mobile
```

### Node 2: Write Binary File
```json
{
  "fileName": "{{ $json.file_name }}",
  "data": "{{ $binary.data }}"
}
```

### Node 3: Execute Command
```bash
cd "florence base 2"
python analyze_otdr_with_lmstudio.py "{{ $json.fileName }}" llama-3.2-3b-instruct
```

### Node 4: Read Binary File
```
Lire le fichier .analysis.json généré
```

### Node 5: Code (Parser JSON)
```javascript
const analysis = JSON.parse($input.item.json.data);
return {
  json: {
    score: analysis.analysis.score,
    status: analysis.analysis.status,
    issues: analysis.analysis.issues,
    recommendations: analysis.analysis.recommendations
  }
};
```

### Node 6: Supabase (Insert)
```
Insérer dans photo_ai_validations
```

## 📝 Critères d'évaluation IA

Le modèle évalue selon:

| Critère | Excellent | Bon | Problème |
|---------|-----------|-----|----------|
| Atténuation | < 0.5 dB/km | 0.5-1 dB/km | > 1 dB/km |
| Réflectance | < -45 dB | -45 à -35 dB | > -35 dB |
| Épissures | < 0.1 dB | 0.1-0.3 dB | > 0.3 dB |
| Trace | Clean | Léger bruit | Très bruité |

## 🛠️ Dépannage

### Erreur: "Impossible de se connecter à LM Studio"

**Solution:**
1. Ouvrir LM Studio
2. Aller dans Server
3. Cliquer sur "Start Server"
4. Vérifier le port (par défaut 1234)

### Erreur: "Timeout de la requête"

**Solutions:**
- Utiliser un modèle plus petit (3B au lieu de 7B)
- Augmenter le timeout dans le code:
  ```python
  response = requests.post(LM_STUDIO_URL, json=payload, timeout=120)
  ```

### Réponse non-JSON de l'IA

**Solution:**
- Réduire la température (déjà à 0.3)
- Utiliser un modèle Instruct (Llama 3.2 Instruct)
- Vérifier que le modèle est bien chargé dans LM Studio

### PDF vide ou mal extrait

**Solution:**
- Vérifier que le PDF n'est pas protégé
- Essayer avec un autre PDF
- Vérifier l'installation de pdfplumber

## 📚 Modèles recommandés

Pour LM Studio, télécharger un de ces modèles:

1. **Llama 3.2 3B Instruct** (recommandé)
   - Rapide (3-5 secondes)
   - Bon équilibre qualité/vitesse

2. **Llama 3.1 8B Instruct**
   - Plus précis
   - Plus lent (10-15 secondes)

3. **Mistral 7B Instruct**
   - Alternative solide
   - Bon en français

## 🚀 Améliorations futures

- [ ] Support multi-modèles en parallèle
- [ ] Analyse d'images OTDR (traces graphiques)
- [ ] Comparaison avec référence
- [ ] Export PDF du rapport
- [ ] Interface web Flask

## 📞 Support

Si le script ne fonctionne pas:
1. Vérifier que LM Studio est lancé
2. Tester l'API manuellement: `curl http://127.0.0.1:1234/v1/models`
3. Vérifier les logs de LM Studio
