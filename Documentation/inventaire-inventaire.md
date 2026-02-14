# Documentation - inventaire/inventaire.html

## Vue d'ensemble

Page principale de gestion de l'inventaire. Permet de gérer le stock des articles, suivre les quantités, les seuils, les prix et exporter les données en Excel.

## Fonctionnalités

### Gestion du stock
- **Liste des articles** : Tableau complet avec photos, références, quantités, prix
- **Ajout/Modification** : Modal pour créer ou modifier un article
- **Recherche** : Recherche par référence, nom, catégorie ou fournisseur
- **Filtrage par dépôt** : Sélection du dépôt actif pour afficher le stock correspondant

### Statistiques (KPIs)
- **Total Articles** : Nombre total d'articles différents
- **En stock** : Articles avec quantité > seuil
- **Seuil bas** : Articles avec quantité <= seuil mais > 0
- **Hors stock** : Articles avec quantité = 0
- **Valeur totale** : Somme de tous les articles (quantité × prix unitaire)

### Export de données
- **Export Excel** : Génération d'un fichier Excel avec toutes les données du dépôt actif
- **Bibliothèque SheetJS** : Utilisation de xlsx.js pour la génération

### Calculs automatiques
- **Prix total** : Calcul automatique (quantité × prix unitaire)
- **Recommandation** : Indication visuelle de la quantité recommandée à commander

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Utilisation de `window.VeloxAPI.getSession()`
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `inventory` gère le stock avec `user_id` implicite
- ✅ Gestion multi-dépôts avec permissions

### Données sensibles
- ✅ Prix et informations financières gérées sécuritairement
- ✅ Validation des données numériques (quantités, prix)
- ✅ Gestion des erreurs sans exposer de détails sensibles

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase
- **SheetJS (xlsx.js)** : Bibliothèque pour export Excel

### Scripts locaux
- `../js/config.js?v=8` : Configuration Supabase
- `../js/api.js?v=8` : API wrapper
- `../js/role-access-control.js?v=1` : Gestion des rôles
- `js/database.js` : Scripts spécifiques à l'inventaire

## Structure du code

### Éléments principaux
1. **Navigation** : Barre de navigation horizontale
2. **Header** : En-tête avec sélecteur de dépôt, boutons d'export et d'ajout
3. **Stats Container** : 5 cartes de statistiques KPIs
4. **Search Input** : Barre de recherche
5. **Table** : Tableau principal avec tous les articles

### Modal
- `modal` : Modal d'ajout/modification d'article

### Variables JavaScript
- Données stockées dans des variables globales (à vérifier dans database.js)

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session`

### Requêtes Supabase directes
- `supabase.from('inventory').select()` : Récupération des articles
- `supabase.from('inventory').insert()` : Création d'article
- `supabase.from('inventory').update()` : Mise à jour d'article
- `supabase.from('inventory').delete()` : Suppression d'article
- `supabase.from('depots').select()` : Récupération des dépôts

## Structure des données

### Article (Inventory)
```javascript
{
  id: uuid,
  depot_id: uuid,
  reference: string,
  name: string,
  category: string,
  supplier: string,
  quantity: number,
  min_quantity: number, // Seuil
  unit_price: decimal,
  photo_url: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (stats-container, search-input)
- **Variables JS** : `camelCase`
- **Tableaux Supabase** : `snake_case` (inventory, depots)

## Gestion des erreurs

- Validation des champs obligatoires
- Validation numérique pour quantités et prix
- Messages d'erreur génériques côté client
- Logs détaillés dans la console pour le débogage

## Notes de développement

- Le module inventaire utilise un système de dépôts multiples
- Les photos sont stockées via Supabase Storage
- L'export Excel utilise la bibliothèque SheetJS (xlsx.js)
- Les statistiques sont calculées en temps réel lors du rendu
