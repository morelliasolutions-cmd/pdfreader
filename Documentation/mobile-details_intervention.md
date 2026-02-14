# Documentation - App mobile/details_intervention.html

## Vue d'ensemble

Page mobile de détails d'une intervention avec capture de photos, analyse IA, scanner de matériel et gestion complète de l'intervention.

## Fonctionnalités

### Affichage des informations
- **Informations client** : Nom, adresse, téléphone, note
- **Informations techniques** : Numéro mandat, PTO, câble d'alim, crochets fibres (BEP)
- **Badges** : Activité, urgence
- **Boutons d'action** : Itinéraire, Appeler le client

### Capture de photos
- **11 photos obligatoires** : Liste prédéfinie des photos à prendre
- **Barre de progression** : Progression des photos (X/11)
- **Score global** : Score sur 10 basé sur la qualité des photos
- **Upload Supabase Storage** : Stockage dans le bucket `intervention-photos`
- **Analyse IA** : Analyse automatique via Edge Function `analyze-photo`

### Scanner de matériel
- **Code-barres QR** : Scanner pour sortir du matériel du stock
- **Bibliothèque Html5Qrcode** : Scanner intégré
- **Recherche manuelle** : Recherche par nom ou code-barres
- **Liste de matériel** : Matériel sorti pour cette intervention

### Gestion de l'intervention
- **Marquer comme terminé** : Bouton pour finaliser l'intervention
- **Statut** : En attente, En cours, Terminé
- **Notes** : Ajout de notes libres

### Analyse IA des photos
- **Scoring automatique** : Score de qualité pour chaque photo (0-10)
- **Edge Function** : Appel à `analyze-photo` pour chaque upload
- **Feedback visuel** : Indicateurs de qualité (vert/jaune/rouge)
- **Recommandations** : Suggestions d'amélioration

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Récupération de l'ID employé via la session
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ Upload de photos sécurisé via Supabase Storage avec RLS
- ✅ Bucket `intervention-photos` avec policies restrictives
- ✅ Utilisation de `auth.uid()` dans les policies

### Données sensibles
- ✅ Photos stockées dans Supabase Storage (bucket privé)
- ✅ Analyse IA via Edge Function (serveur sécurisé)
- ✅ Pas d'exposition de clés API côté client

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase
- **Html5Qrcode v2.3.8** : Bibliothèque de scan QR/code-barres

### Scripts locaux
- `../js/config.js?v=7` : Configuration Supabase
- `../js/api.js?v=7` : API wrapper

## Structure du code

### Éléments principaux
1. **Header** : En-tête avec bouton retour
2. **Progress Bar** : Barre de progression des photos
3. **Client Information Card** : Informations client
4. **Technical Information** : Informations techniques (PTO, fibres)
5. **Photo List** : Liste des 11 photos à prendre
6. **Material Scanner Section** : Scanner et liste de matériel
7. **Action Buttons** : Boutons d'action (Itinéraire, Appeler, Terminer)

### Variables JavaScript
- Variables pour gestion de l'intervention, photos, scanner

### Fonctions principales
- `loadIntervention()` : Charge les détails de l'intervention
- `takePhoto(photoType)` : Capture d'une photo
- `uploadPhoto(file, photoType)` : Upload vers Supabase Storage
- `analyzePhoto(photoUrl, photoType)` : Analyse IA via Edge Function
- `toggleScanner()` : Active/désactive le scanner
- `addMaterial()` : Ajoute du matériel à la liste
- `completeIntervention()` : Marque l'intervention comme terminée

## API utilisées

### Méthodes VeloxAPI
- À vérifier selon l'implémentation

### Requêtes Supabase directes
- `supabase.auth.getUser()` : Récupération de l'utilisateur
- `supabase.from('appointments').select()` : Récupération de l'intervention
- `supabase.from('appointments').update()` : Mise à jour du statut
- `supabase.storage.from('intervention-photos').upload()` : Upload de photos
- `supabase.functions.invoke('analyze-photo')` : Analyse IA des photos

### Edge Functions
- `analyze-photo` : Analyse des photos via IA (probablement LM Studio ou service externe)

## Structure des données

### Photo d'intervention
```javascript
{
  id: uuid,
  appointment_id: uuid,
  photo_type: string, // Type de photo (11 types définis)
  photo_url: string, // URL dans Supabase Storage
  score: number, // Score de qualité (0-10)
  created_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (progress-bar, client-name)
- **Variables JS** : `camelCase`
- **Photo types** : Noms prédéfinis (ex: 'before_connection', 'after_connection')

## Gestion des erreurs

- Gestion des erreurs d'upload de photos
- Gestion des erreurs d'analyse IA
- Messages d'erreur génériques côté client
- Logs détaillés dans la console pour le débogage

## Notes de développement

- Page mobile optimisée avec contrainte max-width
- Scanner intégré avec Html5Qrcode pour lecture de codes-barres
- Upload de photos en temps réel vers Supabase Storage
- Analyse IA automatique après chaque upload
- Score global calculé à partir des scores individuels
- 11 types de photos prédéfinis pour standardisation
- Gestion du matériel sorti lié à l'intervention
