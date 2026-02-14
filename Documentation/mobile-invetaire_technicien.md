# Documentation - App mobile/invetaire_technicien.html

## Vue d'ensemble

Page mobile de sortie de matériel pour les techniciens. Permet de scanner des codes-barres ou rechercher manuellement du matériel dans l'inventaire et de le sortir du stock.

## Fonctionnalités

### Scanner de codes-barres
- **Scanner QR/Code-barres** : Utilisation de Html5Qrcode pour scan
- **Activation caméra** : Bouton pour activer/désactiver le scanner
- **Recherche automatique** : Recherche dans l'inventaire après scan
- **Feedback visuel** : Affichage du résultat du scan

### Recherche manuelle
- **Champ de recherche** : Recherche par nom ou code-barres
- **Autocomplete** : Suggestions de produits (datalist)
- **Sélecteur de dépôt** : Choix du dépôt pour la recherche
- **Bouton de recherche** : Recherche explicite

### Gestion des quantités
- **Stepper** : Boutons +/- pour ajuster la quantité
- **Input numérique** : Champ pour saisie directe
- **Validation** : Vérification que la quantité <= stock disponible

### Liste de matériel sorti
- **Liste dynamique** : Affichage de tous les articles sortis
- **Quantités** : Affichage de la quantité sortie
- **Actions** : Boutons pour modifier ou supprimer un article
- **Total** : Calcul du total des articles sortis

### Sortie de stock
- **Enregistrement** : Sauvegarde des sorties dans la base de données
- **Mise à jour inventaire** : Décrémente les quantités dans l'inventaire
- **Historique** : Enregistrement dans une table de mouvements

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Récupération de l'ID employé via la session
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ Seul le matériel des dépôts autorisés est accessible
- ✅ Les sorties de stock respectent les permissions

### Données sensibles
- ✅ Prix et valeurs de stock gérées sécuritairement
- ✅ Validation des quantités (pas de sortie > stock disponible)
- ✅ Gestion des erreurs sans exposer de détails sensibles

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
2. **Scanner Section** : Bouton scanner et vue caméra
3. **Manual Entry Section** : Zone de saisie manuelle
4. **Material List** : Liste des articles sortis
5. **Action Buttons** : Boutons pour finaliser la sortie

### Variables JavaScript
- Variables pour gestion du scanner, recherche, liste de matériel

### Fonctions principales
- `toggleScanner()` : Active/désactive le scanner
- `stopScanner()` : Arrête le scanner
- `loadGeneralInventory()` : Charge l'inventaire général
- `searchManual()` : Recherche manuelle de produit
- `adjustQty(offset)` : Ajuste la quantité (+1 ou -1)
- `addToList()` : Ajoute un article à la liste de sortie
- `removeFromList(index)` : Retire un article de la liste
- `confirmExit()` : Confirme et enregistre les sorties

## API utilisées

### Requêtes Supabase directes
- `supabase.from('inventory').select()` : Récupération de l'inventaire
- `supabase.from('inventory').update()` : Mise à jour des quantités
- `supabase.from('material_movements').insert()` : Enregistrement des mouvements
- `supabase.from('depots').select()` : Récupération des dépôts

## Structure des données

### Material Movement (Mouvement)
```javascript
{
  id: uuid,
  employee_id: uuid,
  inventory_id: uuid,
  depot_id: uuid,
  quantity: number, // Quantité sortie (négative pour sortie)
  movement_type: 'exit' | 'entry',
  notes: string,
  created_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (scanner-container, manual-code)
- **Variables JS** : `camelCase`
- **Tableaux Supabase** : `snake_case` (inventory, material_movements)

## Gestion des erreurs

- Gestion des erreurs de scan (code non trouvé)
- Validation des quantités (stock insuffisant)
- Messages d'erreur génériques côté client
- Logs détaillés dans la console pour le débogage

## Notes de développement

- Scanner intégré avec Html5Qrcode pour lecture de codes-barres/QR
- Interface mobile optimisée avec contrainte max-width
- Recherche avec autocomplete via datalist HTML
- Stepper pour ajustement intuitif des quantités
- Validation en temps réel des quantités disponibles
- Liste dynamique avec possibilité de modification/suppression
- Enregistrement des mouvements dans une table dédiée pour traçabilité
