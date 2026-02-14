# Documentation - inventaire/collaborateurs.html

## Vue d'ensemble

Page de gestion des collaborateurs (techniciens) et de leur matériel assigné. Permet de gérer les inventaires par technicien avec feuille de signature.

## Fonctionnalités

### Gestion des collaborateurs
- **Liste des techniciens** : Tableau avec tous les techniciens et leurs statistiques
- **Recherche** : Recherche par nom de technicien
- **Statistiques** : Total techniciens, moyenne prix/tech, prix total inventaires

### Matériel par technicien
- **Affichage du matériel** : Liste de tous les articles assignés à un technicien
- **Valeur totale** : Calcul de la valeur totale du matériel assigné
- **Feuille de signature** : Génération d'une feuille de signature imprimable
- **Impression** : Fonctionnalité d'impression optimisée

### Gestion du matériel
- **Ajout de matériel** : Assignation de matériel à un technicien
- **Retrait de matériel** : Retrait de matériel assigné
- **Historique** : Suivi des mouvements de matériel

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Utilisation de Supabase pour l'authentification
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table de liaison technicien-matériel gère les permissions

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `../js/config.js?v=8` : Configuration Supabase
- `../js/api.js?v=8` : API wrapper

## Structure du code

### Éléments principaux
1. **Navigation** : Barre de navigation horizontale
2. **Stats** : 3 cartes de statistiques (Total, Moyenne, Prix Total)
3. **Search** : Barre de recherche
4. **Table** : Tableau des techniciens avec leurs inventaires
5. **Modal** : Modal pour gérer le matériel d'un technicien

## API utilisées

### Requêtes Supabase directes
- `supabase.from('employees').select()` : Récupération des techniciens
- `supabase.from('technician_inventory').select()` : Récupération du matériel assigné
- `supabase.from('technician_inventory').insert()` : Assignation de matériel
- `supabase.from('technician_inventory').delete()` : Retrait de matériel

## Convention de code

- **IDs HTML** : `kebab-case`
- **Variables JS** : `camelCase`
- **Styles d'impression** : Media queries `@media print`

## Notes de développement

- La page utilise des styles CSS spécifiques pour l'impression (`@media print`)
- La feuille de signature est optimisée pour l'impression
- Les statistiques sont calculées à partir des données de matériel assigné
