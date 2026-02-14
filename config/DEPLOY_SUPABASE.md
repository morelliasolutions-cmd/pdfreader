# Guide de déploiement Supabase self-hosted sur Easypanel

## Vue d'ensemble

Ce guide explique comment déployer Supabase en self-hosted sur votre instance Easypanel via l'API.

## Prérequis

- ✅ Instance Easypanel configurée et accessible
- ✅ Clé API Easypanel configurée dans `config/easypanel.json`
- ✅ Node.js installé
- ✅ Domaine configuré (optionnel mais recommandé pour la production)

## Méthode 1 : Déploiement automatisé via script

### Étape 1 : Vérifier la configuration

Assurez-vous que `config/easypanel.json` contient vos informations :

```json
{
  "hostname": "https://votre-instance.easypanel.host",
  "apiKey": "votre-cle-api",
  "timeout": 30000,
  "verifySSL": true
}
```

### Étape 2 : Lancer le script de déploiement

```bash
# Déploiement avec les options par défaut
node config/deploy-supabase.js

# Avec options personnalisées
node config/deploy-supabase.js \
  --project-name mon-projet \
  --service-name supabase \
  --domain supabase.mon-domaine.com
```

### Étape 3 : Attendre le déploiement

Le script va :
1. ✅ Tester la connexion à Easypanel
2. ✅ Créer le projet (s'il n'existe pas)
3. ✅ Générer les secrets sécurisés
4. ✅ Créer le service Supabase
5. ✅ Sauvegarder la configuration dans `config/supabase-deployment.json`

⚠️ **Important** : Gardez `config/supabase-deployment.json` secret, il contient vos mots de passe !

## Méthode 2 : Déploiement manuel via l'interface Easypanel

Si l'API ne fonctionne pas ou si vous préférez l'interface graphique :

### Option A : Utiliser le template Supabase (recommandé pour débuter)

1. Connectez-vous à votre dashboard Easypanel
2. Allez dans **Templates** ou **1-Click Apps**
3. Cherchez **Supabase**
4. Cliquez sur **Deploy**
5. Remplissez les informations :
   - Nom du service
   - Domaine (optionnel)
   - Mots de passe (ou laissez-les générer)
6. Cliquez sur **Deploy**

### Option B : Utiliser Compose Service (plus de contrôle)

1. Dans Easypanel, créez un nouveau **Projet**
2. Dans le projet, créez un **Compose Service**
3. Utilisez le fichier `config/supabase-docker-compose.yml`
4. Configurez les variables d'environnement :
   - `POSTGRES_PASSWORD` : Mote de passe sécurisé
   - `JWT_SECRET` : Secret JWT (généré automatiquement par le script)
   - `API_EXTERNAL_URL` : URL publique de votre API
   - Etc. (voir `config/supabase-docker-compose.yml`)

5. Configurez les volumes persistants :
   - `db-data` pour la base de données PostgreSQL
   - `storage-data` pour le stockage des fichiers

6. Configurez les ports :
   - Port 80 → 8000 (API Kong Gateway)
   - Port 3000 → 3000 (Studio)
   - Port 54322 → 5432 (PostgreSQL, optionnel)

7. Déployez le service

### Option C : Créer depuis un schéma JSON

Si le script a généré `config/supabase-schema.json` :

1. Dans Easypanel, créez un nouveau service
2. Choisissez **"Create from Schema"**
3. Collez le contenu de `config/supabase-schema.json`
4. Cliquez sur **Deploy**

## Configuration post-déploiement

### 1. Récupérer les clés API

Une fois Supabase démarré :

1. Connectez-vous à Supabase Studio : `https://votre-domaine.com/studio`
2. Allez dans **Settings → API**
3. Copiez :
   - **Project URL** : URL de votre API
   - **anon/public key** : Clé publique
   - **service_role key** : Clé secrète (⚠️ gardez-la secrète)

### 2. Configurer votre application

Mettez à jour votre fichier `js/config.js` :

```javascript
const SUPABASE_URL = 'https://votre-domaine.com';
const SUPABASE_ANON_KEY = 'votre-anon-key';
```

### 3. Configurer le domaine et SSL

Dans Easypanel :
1. Allez dans les paramètres du service Supabase
2. Configurez le domaine
3. Easypanel générera automatiquement un certificat SSL Let's Encrypt

### 4. Accéder à Supabase Studio

- URL : `https://votre-domaine.com/studio`
- Le mot de passe est défini dans `STUDIO_PASSWORD` (dans votre configuration)

## Vérification du déploiement

### Vérifier que tous les services sont démarrés

Dans Easypanel, allez dans les logs du service Supabase et vérifiez que tous les conteneurs sont "healthy" :

- ✅ `db` : Base de données PostgreSQL
- ✅ `kong` : API Gateway
- ✅ `auth` : Service d'authentification
- ✅ `rest` : API REST (PostgREST)
- ✅ `storage` : Service de stockage
- ✅ `meta` : Service de métadonnées
- ✅ `studio` : Interface d'administration
- ✅ `functions` : Edge Functions (optionnel)

### Tester l'API

```bash
# Tester l'endpoint health
curl https://votre-domaine.com/rest/v1/

# Devrait retourner une réponse JSON
```

## Sauvegarde et maintenance

### Sauvegardes

1. **Base de données** : Configurez des backups réguliers via `pg_dump`
2. **Volumes** : Les volumes Docker sont persistants mais faites des snapshots réguliers
3. **Configuration** : Gardez `config/supabase-deployment.json` dans un gestionnaire de secrets

### Mise à jour

Pour mettre à jour Supabase :

1. Dans Easypanel, éditez le service
2. Mettez à jour les tags des images Docker dans `docker-compose.yml`
3. Redéployez le service
4. ⚠️ Testez d'abord sur un environnement de staging

## Dépannage

### Le service ne démarre pas

1. Vérifiez les logs dans Easypanel
2. Vérifiez que tous les volumes sont bien montés
3. Vérifiez que les ports ne sont pas déjà utilisés
4. Vérifiez que les variables d'environnement sont correctes

### Erreur de connexion à la base de données

1. Vérifiez que le conteneur `db` est healthy
2. Vérifiez que `POSTGRES_PASSWORD` est correct
3. Vérifiez les logs du conteneur `db`

### Les clés API ne fonctionnent pas

1. Vérifiez que `JWT_SECRET` est le même partout
2. Régénérez les clés depuis Supabase Studio si nécessaire
3. Vérifiez que `API_EXTERNAL_URL` est correct

## Support

Pour plus d'informations :
- 📖 [Documentation Supabase Self-hosting](https://supabase.com/docs/guides/self-hosting)
- 📖 [Documentation Easypanel](https://easypanel.io/docs)
- 🐛 Problèmes ? Vérifiez les logs dans Easypanel

## Notes de sécurité

⚠️ **IMPORTANT** :

- Ne commitez jamais `config/supabase-deployment.json` (il est dans `.gitignore`)
- Ne commitez jamais `config/easypanel.json` (il est dans `.gitignore`)
- Utilisez des mots de passe forts et uniques
- Activez le pare-feu sur votre VPS
- Configurez le SSL/TLS (certificat Let's Encrypt via Easypanel)
- Limitez l'accès à Supabase Studio (utilisez un VPN ou IP whitelist si possible)
- Ne partagez jamais la `SERVICE_ROLE_KEY` publiquement
