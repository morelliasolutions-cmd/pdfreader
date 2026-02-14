# 🎨 Microsoft Florence-2 Docker Image pour RunPod

Image Docker optimisée pour déployer Microsoft Florence-2 sur RunPod en mode serverless avec support GPU.

## 📋 Description

Cette image Docker contient le modèle **Florence-2-base** de Microsoft, un modèle de vision et langage capable de :
- Générer des descriptions détaillées d'images
- Détecter des objets
- Effectuer de la reconnaissance optique de caractères (OCR)
- Proposer des régions d'intérêt
- Et bien plus...

## 🚀 Déploiement sur RunPod

### 1. Construire l'image Docker

```bash
cd "florence base 2"
docker build -t florence-2-runpod:latest .
```

### 2. Tester l'image localement (optionnel)

```bash
docker run --gpus all -p 8000:8000 florence-2-runpod:latest
```

### 3. Publier sur GitHub Container Registry

```bash
# Se connecter à GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Taguer l'image
docker tag florence-2-runpod:latest ghcr.io/USERNAME/florence-2-runpod:latest

# Pousser l'image
docker push ghcr.io/USERNAME/florence-2-runpod:latest
```

### 4. Configurer sur RunPod

1. Allez sur [RunPod](https://www.runpod.io/)
2. Créez un nouveau **Serverless Endpoint**
3. Dans les paramètres :
   - **Container Image**: `ghcr.io/USERNAME/florence-2-runpod:latest`
   - **Container Disk**: Minimum 10GB (le modèle fait ~1.5GB)
   - **GPU Type**: Sélectionnez un GPU compatible (A100, H100, L40S, etc.)
   - **Handler**: `handler.handler`
   - **Port**: `8000`

## 📝 Format des requêtes

### Requête basique (description d'image)

```json
{
  "input": {
    "image": "base64_encoded_image_string"
  }
}
```

### Requête avec tâche spécifique

```json
{
  "input": {
    "image": "base64_encoded_image_string",
    "task": "<DETAILED_CAPTION>",
    "text_prompt": ""
  }
}
```

### Tâches disponibles

- `<DETAILED_CAPTION>` - Description détaillée (par défaut)
- `<CAPTION>` - Description courte
- `<DENSE_REGION_CAPTION>` - Descriptions par région
- `<REGION_PROPOSAL>` - Propositions de régions
- `<OBJECT_DETECTION>` - Détection d'objets
- `<OCR>` - Reconnaissance optique de caractères

## 📦 Structure du projet

```
florence base 2/
├── Dockerfile          # Configuration Docker
├── requirements.txt    # Dépendances Python
├── handler.py         # Handler RunPod serverless
├── README.md          # Documentation
└── .dockerignore      # Fichiers à ignorer
```

## 🔧 Configuration

### Variables d'environnement

- `CUDA_VISIBLE_DEVICES`: Contrôle quel GPU utiliser (par défaut: 0)
- `PYTHONUNBUFFERED`: Assure un logging en temps réel

### Ressources recommandées

- **GPU**: NVIDIA avec au moins 8GB VRAM (A100, H100, L40S recommandés)
- **RAM**: Minimum 16GB
- **Disk**: Minimum 10GB pour le modèle et les dépendances

## 🧪 Test local

### Convertir une image en base64

```python
import base64

with open("image.jpg", "rb") as image_file:
    encoded = base64.b64encode(image_file.read()).decode('utf-8')
    print(encoded)
```

### Tester avec curl

```bash
curl -X POST http://localhost:8000/runsync \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "BASE64_IMAGE_STRING"
    }
  }'
```

## 📚 Ressources

- [Documentation Florence-2](https://github.com/microsoft/Florence-2)
- [Documentation RunPod](https://docs.runpod.io/)
- [Hugging Face Model](https://huggingface.co/microsoft/Florence-2-base-ft)

## ⚠️ Notes importantes

1. **Première requête**: Le modèle sera téléchargé depuis Hugging Face à la première utilisation (peut prendre quelques minutes)
2. **Mémoire GPU**: Le modèle utilise environ 3-4GB de VRAM en float16
3. **Latence**: La première requête peut être plus lente (chargement du modèle)
4. **Coûts**: Surveillez votre utilisation GPU sur RunPod pour éviter les surprises

## 🐛 Dépannage

### Erreur "CUDA out of memory"
- Réduisez la taille de l'image d'entrée
- Utilisez un GPU avec plus de VRAM

### Erreur "Model not found"
- Vérifiez votre connexion internet (téléchargement depuis Hugging Face)
- Le modèle sera mis en cache après le premier téléchargement

### Erreur "Handler timeout"
- Augmentez le timeout dans les paramètres RunPod
- Vérifiez que le GPU est bien alloué

## 📄 Licence

Ce projet utilise le modèle Florence-2 de Microsoft. Consultez la licence du modèle sur [Hugging Face](https://huggingface.co/microsoft/Florence-2-base-ft).

