# 👤 Page de Création d'Utilisateurs - Admin

## 📋 Description

Cette page permet aux administrateurs de créer de nouveaux utilisateurs dans le système. Elle crée automatiquement :
- ✅ Un compte d'authentification (email + mot de passe)
- ✅ Un enregistrement dans la table `employees`
- ✅ Un enregistrement dans la table `user_roles` avec le rôle approprié

## 🚀 Utilisation

### Accès à la page

1. Connectez-vous en tant qu'**admin**
2. Accédez à : `admin-create-user.html`
3. Remplissez le formulaire
4. Cliquez sur "Créer l'utilisateur"

### Formulaire

**Informations de connexion :**
- Email (obligatoire)
- Mot de passe (minimum 6 caractères)

**Informations employé :**
- Prénom (obligatoire)
- Nom (obligatoire)
- Type : Technicien ou Bureau (obligatoire)
- Rôle dans l'entreprise (ex: "Technicien", "Chef de chantier") (obligatoire)
- Statut : Actif, Inactif, Maladie, En congé (obligatoire)
- Date de début (optionnel)
- Jours de congé (défaut: 25)

**Rôle système :**
- admin
- chef_chantier
- dispatcher
- technicien
- direction

## 🔒 Sécurité

### Méthode 1 : Edge Function (Recommandé pour production)

Une Edge Function Supabase a été créée dans `supabase_functions/create-user/`.

**Pour déployer l'Edge Function :**

```bash
# Sur votre VPS, dans le dossier Supabase
cd /root/supabase/docker

# Déployer la fonction
supabase functions deploy create-user
```

**Configuration requise :**
- La fonction utilise automatiquement `SUPABASE_SERVICE_ROLE_KEY` depuis les variables d'environnement
- Vérifie que l'utilisateur qui appelle la fonction est admin

### Méthode 2 : SERVICE_ROLE_KEY directe (Développement uniquement)

⚠️ **ATTENTION** : Cette méthode demande la SERVICE_ROLE_KEY à l'utilisateur.

**La première fois que vous créez un utilisateur :**
1. La page vous demandera la SERVICE_ROLE_KEY
2. Elle sera stockée dans `sessionStorage` (temporaire, supprimée à la fermeture du navigateur)
3. Vous pouvez la trouver dans Supabase Studio > Settings > API

**⚠️ Sécurité :**
- Ne partagez JAMAIS la SERVICE_ROLE_KEY
- Cette méthode est pour le développement uniquement
- Pour la production, utilisez l'Edge Function

## 📝 Récupérer la SERVICE_ROLE_KEY

**Via SSH :**
```bash
grep SERVICE_ROLE_KEY /root/supabase/docker/.env
```

**Via Supabase Studio :**
1. Allez sur `http://76.13.133.147:8000`
2. Settings > API
3. Copiez la clé "service_role" (secret)

## 🔧 Dépannage

### Erreur : "SERVICE_ROLE_KEY requise"
- Entrez la SERVICE_ROLE_KEY quand demandé
- Ou déployez l'Edge Function pour éviter cette étape

### Erreur : "Accès refusé: Admin requis"
- Vous devez être connecté en tant qu'admin
- Vérifiez votre rôle dans `user_roles`

### Erreur : "Erreur création utilisateur"
- Vérifiez que l'email n'existe pas déjà
- Vérifiez que le mot de passe fait au moins 6 caractères
- Vérifiez les logs dans la console (F12)

### L'utilisateur est créé mais n'apparaît pas dans la liste
- Actualisez la page
- Vérifiez dans Supabase Studio que l'utilisateur existe bien

## 📚 Fichiers associés

- `admin-create-user.html` - Page principale
- `supabase_functions/create-user/index.ts` - Edge Function (optionnelle)
- `js/config.js` - Configuration Supabase
- `js/api.js` - API Supabase

## ✅ Checklist après création

- [ ] L'utilisateur peut se connecter avec son email/mot de passe
- [ ] L'utilisateur apparaît dans la table `employees`
- [ ] L'utilisateur a le bon rôle dans `user_roles`
- [ ] Les permissions RLS fonctionnent correctement

## 🎯 Prochaines étapes

Après création d'un utilisateur :
1. L'utilisateur peut se connecter immédiatement
2. Les permissions sont automatiquement appliquées selon le rôle
3. L'utilisateur peut accéder aux fonctionnalités selon son rôle

---

**Date de création** : 31 janvier 2026  
**Version** : 1.0
