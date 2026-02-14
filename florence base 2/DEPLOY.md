# 🚀 Guide de Déploiement - Étapes 2 et 3

Ce guide vous accompagne pour tester et publier l'image Docker Florence-2 sur GitHub Container Registry.

## ⚠️ Prérequis

1. **Docker Desktop** doit être installé et **en cours d'exécution**
2. **GitHub Token** avec les permissions `write:packages` et `read:packages`

### Créer un token GitHub

1. Allez sur https://github.com/settings/tokens
2. Cliquez sur **"Generate new token (classic)"**
3. Donnez un nom au token (ex: "Florence-2 Docker")
4. Cochez les permissions :
   - ✅ `write:packages`
   - ✅ `read:packages`
5. Cliquez sur **"Generate token"**
6. **Copiez le token** (vous ne pourrez plus le voir après)

## 📋 Méthode 1 : Script Automatique (Recommandé)

### Sur Windows (PowerShell)

```powershell
cd "florence base 2"
.\deploy.ps1
```

Le script vous guidera à travers toutes les étapes.

### Avec paramètres

```powershell
.\deploy.ps1 -GitHubUsername "votre-username" -GitHubToken "votre-token"
```

## 📋 Méthode 2 : Commandes Manuelles

### Étape 1 : Construire l'image

```powershell
cd "florence base 2"
docker build -t florence-2-runpod:latest .
```

### Étape 2 : Tester l'image (optionnel)

```powershell
# Démarrer le conteneur
docker run --gpus all -p 8000:8000 florence-2-runpod:latest

# Dans un autre terminal, tester avec une image
python test_local.py path/to/image.jpg
```

### Étape 3 : Publier sur GitHub Container Registry

```powershell
# 1. Se connecter à GitHub Container Registry
echo VOTRE_TOKEN | docker login ghcr.io -u VOTRE_USERNAME --password-stdin

# 2. Taguer l'image
docker tag florence-2-runpod:latest ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest

# 3. Publier l'image
docker push ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest
```

## ✅ Vérification

Une fois publiée, votre image sera disponible à :
```
ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest
```

Vous pouvez vérifier sur : https://github.com/VOTRE_USERNAME?tab=packages

## 🔧 Configuration RunPod

Une fois l'image publiée, utilisez ces paramètres sur RunPod :

- **Container Image**: `ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest`
- **Handler**: `handler.handler`
- **Port**: `8000`
- **Container Disk**: `10 GB` (minimum)
- **GPU**: A100, H100, ou L40S (minimum 8GB VRAM)

## 🐛 Dépannage

### Erreur "Docker Desktop n'est pas démarré"
- Démarrez Docker Desktop
- Attendez que l'icône Docker soit verte dans la barre des tâches

### Erreur "unauthorized" lors du push
- Vérifiez que votre token GitHub a les permissions `write:packages`
- Vérifiez que vous utilisez le bon nom d'utilisateur

### Erreur "denied: permission_denied"
- Assurez-vous que le package n'existe pas déjà avec des permissions différentes
- Vérifiez les paramètres de visibilité du package sur GitHub

### L'image est trop lente à construire
- C'est normal, la première construction peut prendre 10-20 minutes
- Les dépendances PyTorch et CUDA sont volumineuses

## 📝 Notes

- La première construction peut prendre **10-20 minutes** (téléchargement des dépendances)
- L'image finale fait environ **8-10 GB**
- Le modèle Florence-2 sera téléchargé automatiquement lors de la première utilisation (environ 1.5 GB)

