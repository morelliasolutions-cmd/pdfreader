# 🎨 Florence-2-base Docker - Test Local

Image Docker pour tester le modèle **Microsoft Florence-2-base** en local (CPU ou GPU).

## 📦 Fichiers disponibles

- `Dockerfile.cpu` - Version optimisée pour CPU (test local)
- `Dockerfile` - Version GPU pour RunPod/production
- `app.py` - Script de test simple (console)
- `handler.py` - Handler RunPod serverless
- `docker-compose.yml` - Configuration Docker Compose

## 🚀 Test local rapide (CPU)

### Option 1 : Docker Build + Run

```bash
# Construire l'image CPU
docker build -f Dockerfile.cpu -t florence2-base-local .

# Lancer le test
docker run --rm florence2-base-local
```

### Option 2 : Docker Compose

```bash
# Démarrer
docker-compose up florence2-cpu

# Arrêter
docker-compose down
```

## 📝 Ce que fait le test

Le script `app.py` :

1. ✅ Télécharge le modèle `microsoft/Florence-2-base` depuis Hugging Face
2. ✅ Télécharge une image de test (voiture)
3. ✅ Exécute 3 tâches :
   - `<CAPTION>` - Description courte
   - `<DETAILED_CAPTION>` - Description détaillée
   - `<MORE_DETAILED_CAPTION>` - Description très détaillée
4. ✅ Affiche les résultats dans la console

## 🖼️ Utiliser votre propre image

```bash
# Placer votre image dans le dossier
cp mon_image.jpg test.jpg

# Relancer
docker run --rm -v $(pwd)/test.jpg:/app/test.jpg florence2-base-local
```

## ⚡ Version GPU

Pour utiliser un GPU NVIDIA :

```bash
# Utiliser le Dockerfile original
docker build -t florence2-gpu .

# Lancer avec GPU
docker run --rm --gpus all florence2-gpu
```

## 🔧 Personnaliser

### Modifier les tâches testées

Éditez `app.py`, section `tasks` :

```python
tasks = [
    ("<CAPTION>", "Description courte"),
    ("<OD>", "Détection d'objets"),  # Nouveau
    ("<OCR>", "Reconnaissance de texte"),  # Nouveau
]
```

### Tâches disponibles

- `<CAPTION>` - Description courte
- `<DETAILED_CAPTION>` - Description détaillée
- `<MORE_DETAILED_CAPTION>` - Description très détaillée
- `<OD>` - Détection d'objets (Object Detection)
- `<DENSE_REGION_CAPTION>` - Légendes par région
- `<REGION_PROPOSAL>` - Proposition de régions
- `<OCR>` - Reconnaissance de texte
- `<OCR_WITH_REGION>` - OCR avec régions

## 📊 Sortie attendue

```
============================================================
🚀 Test de Microsoft Florence-2-base
============================================================

📊 Configuration:
   Device: cpu
   Dtype: torch.float32
   Model: microsoft/Florence-2-base

📥 Chargement du modèle et du processeur...
✅ Modèle chargé avec succès

🖼️  Chargement de l'image: test.jpg
   Taille: (640, 480)

📋 Description courte (<CAPTION>)
------------------------------------------------------------
✅ Résultat: {'<CAPTION>': 'A red car parked on the street'}

📋 Description détaillée (<DETAILED_CAPTION>)
------------------------------------------------------------
✅ Résultat: {'<DETAILED_CAPTION>': 'A red sedan parked...'}

============================================================
✅ Test terminé avec succès!
============================================================
```

## 🐛 Problèmes courants

### Erreur : "trust_remote_code"

✅ **Solution** : Déjà géré dans le code (`trust_remote_code=True`)

### Erreur : "flash_attn not found"

✅ **Solution** : Le code utilise un patch qui désactive SDPA si nécessaire

### Erreur : Mémoire insuffisante (CPU)

Le modèle base nécessite ~2-3 GB de RAM. Si vous avez moins :

```bash
# Utiliser un modèle plus petit (à implémenter)
# Ou ajouter du swap
```

## 📚 Documentation complète

- [DEPLOY.md](DEPLOY.md) - Déploiement RunPod
- [PUBLISH.md](PUBLISH.md) - Publication GitHub Container Registry
- [TEST_STATUS.md](TEST_STATUS.md) - Historique des tests

## 🔗 Liens utiles

- [Modèle sur Hugging Face](https://huggingface.co/microsoft/Florence-2-base)
- [Documentation Florence-2](https://huggingface.co/microsoft/Florence-2-base/tree/main)
- [RunPod Documentation](https://docs.runpod.io/)
