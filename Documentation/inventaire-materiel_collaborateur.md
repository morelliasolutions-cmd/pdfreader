# Documentation - inventaire/materiel_collaborateur.html

## Vue d'ensemble

Page de détail du matériel assigné à un collaborateur avec feuille de signature imprimable. Optimisée pour l'impression recto-verso.

## Fonctionnalités

### Affichage du matériel
- **Liste complète** : Tous les articles assignés au collaborateur sélectionné
- **Informations détaillées** : Référence, nom, quantité, prix unitaire, prix total
- **En-tête collaborateur** : Informations du technicien (nom, date, etc.)

### Feuille de signature
- **Optimisée impression** : Styles CSS spécifiques pour l'impression (`@media print`)
- **Recto-verso** : Optimisation pour impression recto-verso
- **Zones de signature** : Espaces pour signatures technicien et responsable
- **Notes** : Section pour notes et commentaires

### Impression
- **Bouton d'impression** : Génération directe de la feuille imprimable
- **Styles optimisés** : Taille de police réduite (8pt), marges optimisées
- **Masquage éléments** : Les éléments non nécessaires sont masqués à l'impression

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Utilisation de Supabase pour l'authentification
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ Seul le matériel assigné au collaborateur est visible

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase
- **SQL.js** : Bibliothèque SQL en JavaScript (si utilisée)

### Scripts locaux
- `../js/config.js?v=8` : Configuration Supabase
- `../js/api.js?v=8` : API wrapper

## Structure du code

### Éléments principaux
1. **Navigation** : Barre de navigation (masquée à l'impression)
2. **En-tête** : Informations collaborateur (print-header)
3. **Table** : Tableau du matériel assigné
4. **Section signatures** : Zones de signature (signature-section)
5. **Section notes** : Zone de notes (notes-section)

### Classes CSS spéciales
- `.no-print` : Éléments masqués à l'impression
- `.print-content` : Contenu optimisé pour impression
- `.print-header` : En-tête optimisé
- `.signature-section` : Section signatures
- `.signature-line` : Ligne de signature

## API utilisées

### Requêtes Supabase directes
- `supabase.from('technician_inventory').select()` : Récupération du matériel assigné
- `supabase.from('employees').select()` : Récupération des informations du collaborateur

## Convention de code

- **IDs HTML** : `kebab-case`
- **Classes CSS print** : Préfixe `print-` pour les éléments d'impression
- **Media queries** : `@media print` pour les styles d'impression

## Notes de développement

- La page est optimisée pour l'impression avec des styles spécifiques
- Les tailles de police sont réduites à 8-9pt pour l'impression
- La section signatures utilise `page-break-inside: avoid` pour éviter les coupures
- Les éléments de navigation sont masqués à l'impression via `.no-print`
