# Configuration Supabase - Système de Validation IA et RLS

## 📋 Résumé

Ce document décrit la configuration complète du système de validation IA automatique et des Row Level Security (RLS) pour l'application mobile de gestion d'interventions FTTH.

## 🗄️ Tables Créées

### 1. `intervention_details`
Table principale pour les interventions détaillées FTTH.
- Contient les informations techniques (mandat, PTO, câble, fibres)
- Lien avec `appointments`
- Statut de l'intervention

### 2. `intervention_photos`
Table pour stocker les photos d'intervention.
- Lien avec `intervention_details`
- Informations sur le fichier (nom, taille, type)
- Chemin dans Supabase Storage

### 3. `photo_ai_validations`
Table pour les résultats de validation IA.
- Statut : `validated`, `partial`, `rejected`, `pending`
- Commentaire IA
- Score de confiance
- Détails supplémentaires

### 4. `user_roles`
Table pour gérer les rôles utilisateurs.
- Rôles : `admin`, `chef_chantier`, `dispatcher`, `technicien`
- Lien avec `auth.users` et `employees`

### 5. `upload_events`
Table de journalisation centralisée des uploads pour déclencher les workflows d'automatisation (n8n).
- **Type** : `intervention_photo`, `expense_receipt`, `accident_report`
- **Bucket** : `private-uploads`
- **Trigger** : Sert de déclencheur pour n8n (INSERT)

## 🔐 Système de Rôles et RLS

### Technicien
- ✅ Accès uniquement à l'application mobile
- ✅ Peut créer/modifier ses propres interventions
- ✅ Peut uploader des photos (via mécanisme privé)
- ✅ Peut voir les validations IA de ses photos

### Dispatcher
- ✅ Accès à `planif` (appointments)
- ✅ Lecture seule sur `personnel` (employees)
- ✅ Lecture seule sur `inventaire` (inventory_items)
- ✅ Lecture seule sur toutes les interventions
- ✅ Lecture sur `upload_events`

### Chef de chantier
- ✅ Accès à `planif` (appointments)
- ✅ Accès à `pointage` (time_entries)
- ✅ Accès à `production`
- ✅ Accès à `inventaire` (inventory_items)
- ✅ Consultation seule sur `personnel` (employees)
- ✅ Lecture seule sur toutes les interventions
- ✅ Lecture sur `upload_events`

### Admin
- ✅ Accès complet partout

## 🤖 Système de Validation et Automation (n8n)

### Workflow Global

1. **Upload Mobile** : L'application upload le fichier dans le bucket privé `private-uploads`.
2. **Event DB** : L'application insère une ligne dans la table `upload_events` contenant le chemin du fichier.
3. **Déclencheur n8n** : n8n écoute les `INSERT` sur `upload_events`.
4. **Traitement n8n** :
   - Récupère le fichier depuis le bucket privé.
   - Analyse (IA Vision, OCR Note de frais, etc.).
   - Met à jour les tables métiers (`intervention_photos`, etc.) ou notifie.
5. **Mise à jour UI** : L'application mobile (Listening Realtime ou Polling) affiche les résultats mis à jour en base.

## 📝 Configuration Requise

### 1. Variables d'environnement Supabase

Dans votre projet Supabase, configurez :
- `SUPABASE_URL` : URL de votre projet
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (pour Edge Functions ou n8n)

### 2. Créer le Bucket Storage Privé

Dans Supabase Dashboard :
1. Allez dans Storage
2. Créez un bucket nommé `private-uploads`
3. Configurez les permissions :
   - **Public** : ⚠️ NON (Privé)
   - **Authenticated** : Peut uploader (INSERT)
   - **Service Role** : Accès complet

### 3. Exécuter le Script SQL

Exécutez `SETUP_PRIVATE_UPLOADS.sql` pour créer la table `upload_events` et les politiques RLS nécessaires.

## 🔄 Triggers et Webhooks

### Trigger Automatique
Un trigger PostgreSQL (`trigger_photo_ai_analysis_on_insert`) déclenche automatiquement l'analyse IA quand une photo est insérée.

### Alternative : Webhook
Si vous préférez un webhook externe, utilisez la notification PostgreSQL `photo_uploaded` qui envoie un événement quand une photo est uploadée.

## 📊 Exemple d'Utilisation

### Créer une intervention
```javascript
const { data, error } = await supabase
  .from('intervention_details')
  .insert({
    appointment_id: 'appointment-uuid',
    mandate_number: 'MND-89204',
    pto_reference: 'FI-2938-A',
    technician_id: 'technician-uuid'
  });
```

### Uploader une photo
```javascript
// Automatique via handlePhotoUpload()
// La photo est uploadée, enregistrée et analysée automatiquement
```

### Récupérer les validations IA
```javascript
const { data } = await supabase
  .from('photo_ai_validations')
  .select('*, intervention_photos(*)')
  .eq('intervention_photos.intervention_detail_id', interventionId);
```

## 🚀 Prochaines Étapes

1. ✅ Tables créées
2. ✅ RLS configuré
3. ✅ Edge Function déployée
4. ⏳ Intégrer votre modèle IA dans `analyze-photo`
5. ⏳ Configurer les variables d'environnement
6. ⏳ Créer le bucket Storage
7. ⏳ Assigner les rôles aux utilisateurs
8. ⏳ Tester le workflow complet

## 📚 Documentation

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Edge Functions](https://supabase.com/docs/guides/functions)


