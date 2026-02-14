# Solution Simplifiée : Déployer Supabase sur Easypanel

## ⚠️ Problème avec Docker Compose personnalisé

Le docker-compose personnalisé peut avoir des problèmes :
- Fichiers manquants (kong.yml, volumes/api/, volumes/functions/)
- Volumes montés comme répertoires au lieu de fichiers
- Configuration complexe difficile à maintenir

## ✅ Solution Recommandée : Utiliser le Template Easypanel

**Easypanel propose un template Supabase 1-Click prêt à l'emploi !**

### Méthode 1 : Template 1-Click (RECOMMANDÉ)

1. **Connectez-vous à Easypanel** : `https://yhmr4j.easypanel.host`

2. **Créez un nouveau projet** :
   - Cliquez sur "New Project" ou "Nouveau Projet"
   - Nommez-le : `veloxnumeric`

3. **Utilisez le Template Supabase** :
   - Dans le projet, cliquez sur "Add Service" ou "Ajouter un service"
   - Cherchez "Templates" ou "1-Click Apps"
   - Sélectionnez **"Supabase"**
   - Cliquez sur "Deploy" ou "Déployer"

4. **Configurez les variables d'environnement** :
   - Service name : `supabase` (ou comme vous voulez)
   - Utilisez les valeurs depuis `config/supabase-deployment.json` :
     ```
     POSTGRES_PASSWORD=ae9bf4dcb11e265619953e751be5dfc5007551a1f3538e1987c1dcf8fa935433
     JWT_SECRET=035f850f68ea09404e714365d937007e021a2f30b31bd4df8b0bbb717307b0998abfba6200ef58e2c748dcb40786d2e33146c7742092b64895bf1eec32677699
     ```
   - **Important** : Les clés `ANON_KEY` et `SERVICE_ROLE_KEY` seront générées automatiquement au premier démarrage

5. **Configurez le domaine** (si vous en avez un) :
   - Dans les paramètres du service Supabase
   - Ajoutez votre domaine
   - Easypanel générera automatiquement le certificat SSL

6. **Déployez** :
   - Cliquez sur "Deploy" ou "Déployer"
   - Attendez quelques minutes que tous les services démarrent

### Méthode 2 : Compose Service avec Git Supabase Officiel

Si le template ne fonctionne pas, utilisez le repo Supabase officiel :

1. **Dans Easypanel, créez un Compose Service**

2. **Source Git** :
   - Repository : `https://github.com/supabase/supabase`
   - Branch : `master`
   - Docker Compose Path : `docker/docker-compose.yml`
   - Docker Compose Env Path : `docker/.env.example`

3. **Variables d'environnement** :
   - Copiez toutes les variables depuis `config/supabase-deployment.json`
   - Ajoutez-les dans la section "Environment Variables" d'Easypanel

4. **Volumes** :
   - Easypanel gérera automatiquement les volumes persistants
   - Assurez-vous que les volumes sont activés pour :
     - `db-data` (PostgreSQL)
     - `storage-data` (Fichiers)

5. **Déployez**

## 🔧 Résolution des Problèmes Courants

### Problème : "kong.yml is a directory"

**Solution** : Utilisez le template Easypanel qui gère cela automatiquement, ou assurez-vous que le repo Git contient le bon fichier.

### Problème : Variables d'environnement manquantes

**Solution** : Vérifiez que toutes les variables depuis `config/supabase-deployment.json` sont bien configurées dans Easypanel.

### Problème : Services ne démarrent pas

**Solution** :
1. Vérifiez les logs dans Easypanel
2. Assurez-vous que tous les services dépendants démarrent correctement
3. Vérifiez que les volumes sont bien montés

## 📋 Checklist de Déploiement

- [ ] Projet créé dans Easypanel
- [ ] Template Supabase sélectionné OU Compose Service configuré
- [ ] Variables d'environnement configurées (POSTGRES_PASSWORD, JWT_SECRET)
- [ ] Volumes persistants activés (db-data, storage-data)
- [ ] Domaine configuré (optionnel)
- [ ] Service déployé
- [ ] Attente du démarrage complet (5-10 minutes)
- [ ] Accès à Supabase Studio vérifié
- [ ] Clés API récupérées depuis Studio

## 🎯 Accès à Supabase Studio

Une fois déployé :

- **URL Studio** : `https://votre-domaine.com/studio` ou `https://yhmr4j.easypanel.host/supabase/studio` (selon votre configuration)
- **Credentials** : Utilisez les credentials configurés dans Easypanel

## 📝 Notes Importantes

1. **Les clés ANON_KEY et SERVICE_ROLE_KEY** sont générées automatiquement au premier démarrage
2. **Récupérez-les** depuis Supabase Studio → Settings → API
3. **Gardez vos secrets** dans `config/supabase-deployment.json` (déjà dans .gitignore)
4. **Le template Easypanel** est la méthode la plus simple et la plus fiable

## 🆘 Support

Si vous rencontrez encore des problèmes :
1. Vérifiez les logs dans Easypanel
2. Consultez la documentation Easypanel : https://easypanel.io/docs
3. Vérifiez la documentation Supabase : https://supabase.com/docs/guides/self-hosting
