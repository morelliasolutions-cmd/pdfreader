# 📤 Publication sur GitHub Container Registry

## ✅ Étape 1 : Créer un token GitHub

1. Allez sur : https://github.com/settings/tokens
2. Cliquez sur **"Generate new token (classic)"**
3. Donnez un nom : `Florence-2 Docker`
4. Cochez les permissions :
   - ✅ `write:packages`
   - ✅ `read:packages`
5. Cliquez sur **"Generate token"**
6. **Copiez le token** (vous ne pourrez plus le voir après !)

## 📤 Étape 2 : Publier l'image

Une fois que vous avez votre token, exécutez ces commandes :

```powershell
# Remplacez VOTRE_USERNAME et VOTRE_TOKEN
$username = "VOTRE_USERNAME"
$token = "VOTRE_TOKEN"

# Se connecter à GitHub Container Registry
echo $token | docker login ghcr.io -u $username --password-stdin

# Taguer l'image
docker tag florence-2-runpod:latest ghcr.io/$username/florence-2-runpod:latest

# Publier l'image
docker push ghcr.io/$username/florence-2-runpod:latest
```

## ✅ Vérification

Votre image sera disponible à :
```
ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest
```

Vous pouvez vérifier sur : https://github.com/VOTRE_USERNAME?tab=packages

## 🔧 Utilisation sur RunPod

Une fois publiée, utilisez cette URL sur RunPod :
- **Container Image**: `ghcr.io/VOTRE_USERNAME/florence-2-runpod:latest`
- **Handler**: `handler.handler`
- **Port**: `8000`

