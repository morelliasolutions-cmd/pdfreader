# Documentation des pages HTML - Veloxnumeric

Ce dossier contient la documentation de toutes les pages HTML de l'application Veloxnumeric.

## Structure

La documentation suit les principes définis dans `AGENTS.md` et documente chaque page selon :
- Vue d'ensemble et objectif
- Fonctionnalités principales
- Sécurité (authentification, RLS)
- Scripts et dépendances
- Structure du code
- API utilisées
- Gestion des erreurs

## Pages principales (racine)

- [index.md](./index.md) - Page de connexion principale
- [dashboard.md](./dashboard.md) - Tableau de bord avec statistiques
- [personnel.md](./personnel.md) - Gestion du personnel
- [mandats.md](./mandats.md) - Gestion des mandats clients
- [planif.md](./planif.md) - Planning techniciens (vue Gantt)
- [pointage.md](./pointage.md) - Saisie des heures de travail
- [production.md](./production.md) - Saisie de production
- [parametres.md](./parametres.md) - Paramètres utilisateur

## Pages inventaire/

- [inventaire-inventaire.md](./inventaire-inventaire.md) - Gestion du stock
- [inventaire-technicien.md](./inventaire-technicien.md) - Matériel par technicien
- [inventaire-vehicule.md](./inventaire-vehicule.md) - Matériel par véhicule
- [inventaire-commandes.md](./inventaire-commandes.md) - Gestion des commandes
- [inventaire-collaborateurs.md](./inventaire-collaborateurs.md) - Collaborateurs inventaire
- [inventaire-index.md](./inventaire-index.md) - Page d'accueil inventaire
- [inventaire-parametres.md](./inventaire-parametres.md) - Paramètres inventaire
- [inventaire-template_materiel.md](./inventaire-template_materiel.md) - Template matériel

## Pages App mobile/

- [mobile-index.md](./mobile-index.md) - Connexion mobile
- [mobile-Rendez-vous_technicien.md](./mobile-Rendez-vous_technicien.md) - Rendez-vous technicien
- [mobile-details_intervention.md](./mobile-details_intervention.md) - Détails intervention
- [mobile-invetaire_technicien.md](./mobile-invetaire_technicien.md) - Inventaire technicien mobile

## Conventions

Toutes les documentations suivent les mêmes conventions :
- Respect des principes de sécurité définis dans `AGENTS.md`
- Documentation des interactions Supabase
- Description des APIs utilisées
- Structure du code et variables
- Gestion des erreurs

## Notes importantes

⚠️ **Sécurité** : Toutes les pages doivent respecter :
- Vérification de session obligatoire
- Utilisation des RLS Supabase
- Pas d'exposition de clés sensibles
- Messages d'erreur génériques côté client

✅ **Bonnes pratiques** :
- Utilisation de `window.VeloxAPI` pour les appels API
- Vérification de l'initialisation de Supabase avant utilisation
- Gestion des erreurs avec try/catch
- Logs détaillés dans la console (dev uniquement)
