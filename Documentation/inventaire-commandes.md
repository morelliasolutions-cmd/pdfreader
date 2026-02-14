# Documentation - inventaire/commandes.html

## Vue d'ensemble

Page de gestion des commandes fournisseurs. Permet de suivre les commandes passées, leurs statuts, factures et montants (HT/TTC).

## Fonctionnalités

### Gestion des commandes
- **Liste des commandes** : Tableau avec toutes les commandes
- **Ajout de commande** : Modal pour créer une nouvelle commande
- **Modification** : Édition des commandes existantes
- **Suppression** : Suppression de commandes

### Statistiques (KPIs)
- **Total Commandes** : Nombre total de commandes
- **Total TTC** : Montant total toutes taxes comprises
- **Total HT** : Montant total hors taxes
- **Ce mois** : Nombre de commandes du mois en cours

### Informations commande
- **Numéro de commande** : Référence unique
- **Fournisseur** : Nom du fournisseur
- **Date de commande** : Date de passation
- **Date de livraison** : Date de réception prévue/réelle
- **Montant HT** : Montant hors taxes
- **Montant TTC** : Montant avec taxes
- **Statut** : En attente, Confirmée, Livrée, Annulée, etc.
- **Facture PDF** : Upload et stockage de la facture

### Filtrage et recherche
- **Recherche** : Recherche par numéro, fournisseur, statut
- **Filtres par statut** : Filtrage rapide par statut
- **Tri** : Tri par date, montant, statut

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Utilisation de `window.VeloxAPI.getSession()`
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `orders` gère les commandes avec `user_id` implicite

### Données sensibles
- ✅ Montants financiers gérés sécuritairement
- ✅ Factures PDF stockées via Supabase Storage
- ✅ Validation des montants numériques

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `../js/config.js?v=8` : Configuration Supabase
- `../js/api.js?v=8` : API wrapper
- `../js/role-access-control.js?v=1` : Gestion des rôles

## Structure du code

### Éléments principaux
1. **Navigation** : Barre de navigation horizontale
2. **Header** : En-tête avec bouton "Nouvelle commande"
3. **Stats** : 4 cartes de statistiques KPIs
4. **Search & Filters** : Barre de recherche et filtres
5. **Table** : Tableau des commandes

### Modal
- Modal d'ajout/modification de commande

## API utilisées

### Requêtes Supabase directes
- `supabase.from('orders').select()` : Récupération des commandes
- `supabase.from('orders').insert()` : Création de commande
- `supabase.from('orders').update()` : Mise à jour de commande
- `supabase.from('orders').delete()` : Suppression de commande
- `supabase.storage.from('invoices').upload()` : Upload de facture PDF

## Structure des données

### Commande (Order)
```javascript
{
  id: uuid,
  order_number: string, // Numéro de commande
  supplier: string, // Fournisseur
  order_date: date, // Date de commande
  delivery_date: date, // Date de livraison
  amount_ht: decimal, // Montant HT
  amount_ttc: decimal, // Montant TTC
  status: string, // Statut
  invoice_url: string, // URL de la facture PDF
  notes: string, // Notes
  created_at: timestamp,
  updated_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (add-order-btn, stat-total)
- **Variables JS** : `camelCase`
- **Tableaux Supabase** : `snake_case` (orders)

## Notes de développement

- Les factures PDF sont stockées dans Supabase Storage (bucket 'invoices')
- Le calcul TTC est fait automatiquement si seul le HT est fourni (taux TVA par défaut)
- Les statistiques sont calculées à partir des commandes de la base de données
- Le filtre "Ce mois" calcule les commandes du mois calendaire en cours
