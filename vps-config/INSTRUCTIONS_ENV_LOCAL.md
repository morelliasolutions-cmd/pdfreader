# Instructions pour mettre à jour .env.local

## ⚠️ IMPORTANT

Le fichier `.env.local` doit être mis à jour avec toutes les variables du VPS pour que Supabase fonctionne correctement.

## Méthode 1 : Copier-coller manuel

1. Ouvrez `vps-config/env-local-reference.txt`
2. Copiez TOUT le contenu
3. Remplacez le contenu de `.env.local` par ce que vous avez copié

## Méthode 2 : Utiliser le script PowerShell

```powershell
# Corriger le script d'abord (il y a une erreur de syntaxe)
# Puis exécuter :
.\update-env-local.ps1
```

## Variables critiques manquantes

Si vous voyez des warnings comme "variable is not set", ajoutez ces variables dans `.env.local` :

```bash
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
PG_META_CRYPTO_KEY=gl1IwrDV7q9dyvDSe+k7m7Bujat//Argg2L3i0630mQ=
LOGFLARE_PUBLIC_ACCESS_TOKEN=lf_pub_6d4f2a9b8c7e1d3f4a5b6c7d
LOGFLARE_PRIVATE_ACCESS_TOKEN=lf_priv_7e3d2c1b9a8f6e5d4c3b2a1f
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=f1167a4f1da118ec4b49e59a
SECRET_KEY_BASE=qNAKfTmKJ/lJGrvKuX2Jt17WTXZDshHYZkXuWyZ0y14=
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
```

## Vérification

Après avoir mis à jour `.env.local`, vérifiez qu'il n'y a plus de warnings :

```powershell
docker-compose -f docker-compose.local.yml --env-file .env.local config
```

Si vous voyez encore des warnings, ajoutez les variables manquantes.
