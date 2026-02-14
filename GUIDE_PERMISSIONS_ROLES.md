# Guide des Permissions par Rôle

## 📋 Vue d'ensemble

Ce document décrit les permissions d'accès pour chaque rôle dans l'application web Veloxnumeric.

## 🔐 Rôles et Permissions

### 👨‍💼 **ADMIN**
**Accès complet** (sauf app mobile technicien)

| Page/Module | Accès | Édition |
|-------------|-------|---------|
| Tableau de bord | ✅ | ✅ |
| Pointage | ✅ | ✅ |
| Production | ✅ | ✅ |
| Personnel | ✅ | ✅ |
| Planning | ✅ | ✅ |
| Inventaire | ✅ | ✅ |
| Paramètres | ✅ | ✅ |
| App Mobile Technicien | ❌ | ❌ |

---

### 👷 **CHEF DE CHANTIER**
**Accès limité avec permissions d'édition**

| Page/Module | Accès | Édition |
|-------------|-------|---------|
| Tableau de bord | ❌ | ❌ |
| Pointage | ✅ | ✅ |
| Production | ✅ | ✅ |
| Personnel | ✅ | 👁️ Lecture seule |
| Planning | ✅ | ✅ |
| Inventaire | ✅ | ✅ |
| Paramètres | ❌ | ❌ |
| App Mobile Technicien | ❌ | ❌ |

**Détails :**
- Peut consulter le personnel mais ne peut pas modifier
- Peut gérer le pointage, la production et le planning
- Peut gérer l'inventaire

---

### 📞 **DISPATCHER**
**Accès très limité - Lecture seule sur plusieurs modules**

| Page/Module | Accès | Édition |
|-------------|-------|---------|
| Tableau de bord | ❌ | ❌ |
| Pointage | ❌ | ❌ |
| Production | ❌ | ❌ |
| Personnel | ✅ | 👁️ Lecture seule |
| Planning | ✅ | ✅ |
| Inventaire | ✅ | ✅ |
| Paramètres | ❌ | ❌ |
| App Mobile Technicien | ❌ | ❌ |

**Détails :**
- Accès uniquement à : Planning, Personnel (lecture), Inventaire
- Ne peut pas accéder au tableau de bord, pointage, production, paramètres
- Peut gérer le planning et l'inventaire
- Peut consulter le personnel mais ne peut pas modifier

---

### 🔧 **TECHNICIEN**
**Accès uniquement à l'application mobile**

| Page/Module | Accès | Édition |
|-------------|-------|---------|
| Tableau de bord | ❌ | ❌ |
| Pointage | ❌ | ❌ |
| Production | ❌ | ❌ |
| Personnel | ❌ | ❌ |
| Planning | ❌ | ❌ |
| Inventaire | ❌ | ❌ |
| Paramètres | ❌ | ❌ |
| App Mobile Technicien | ✅ | ✅ |

**Détails :**
- Accès exclusif à l'application mobile (`App mobile/`)
- Aucun accès à l'application web principale
- Peut gérer ses propres interventions via l'app mobile

---

## 🛡️ Fonctionnement du Système

### Contrôle d'accès automatique

Le système de contrôle d'accès (`js/role-access-control.js`) :

1. **Vérifie le rôle** de l'utilisateur connecté depuis Supabase
2. **Masque les onglets** non autorisés dans la navigation
3. **Redirige** si l'utilisateur tente d'accéder à une page non autorisée
4. **Applique les restrictions d'édition** sur les pages en lecture seule
5. **Affiche des badges** pour indiquer le mode lecture seule

### Fichiers modifiés

Tous les fichiers HTML principaux ont été mis à jour avec :
- ✅ Script `js/role-access-control.js` ajouté
- ✅ IDs ajoutés aux liens de navigation (`nav-dashboard`, `nav-pointage`, etc.)
- ✅ Contrôle d'accès automatique au chargement de la page

### Pages protégées

- `dashboard.html` - Tableau de bord
- `pointage.html` - Pointage
- `production.html` - Production
- `personnel.html` - Personnel (avec mode lecture seule)
- `planif.html` - Planning
- `inventaire/inventaire.html` - Inventaire
- `parametres.html` - Paramètres

## 🔄 Comment ça marche

### Au chargement d'une page

1. Le script `role-access-control.js` s'exécute
2. Il récupère le rôle de l'utilisateur depuis `user_roles` (Supabase)
3. Il vérifie si l'utilisateur a accès à la page actuelle
4. Si non autorisé → redirection vers une page autorisée
5. Si autorisé → masquage des onglets non autorisés
6. Application des restrictions d'édition si nécessaire

### Exemple : Dispatcher

Quand un dispatcher se connecte :
- ✅ Voit uniquement : Planning, Personnel, Inventaire
- ❌ Ne voit pas : Tableau de bord, Pointage, Production, Paramètres
- 👁️ Sur Personnel : voit un badge "Mode lecture seule" et les boutons d'ajout/modification sont masqués

## 📝 Notes importantes

1. **Cache des rôles** : Les rôles sont mis en cache dans `localStorage` pendant 5 minutes pour améliorer les performances
2. **Redirection automatique** : Si un utilisateur tente d'accéder directement à une page non autorisée, il est redirigé
3. **RLS Supabase** : Les permissions RLS dans Supabase complètent ce système côté client
4. **Sécurité** : Ce système est une couche de sécurité supplémentaire. La vraie sécurité vient des RLS dans Supabase

## 🚀 Test des permissions

Pour tester les permissions :

1. Connectez-vous avec un compte dispatcher
2. Vérifiez que seuls Planning, Personnel et Inventaire sont visibles
3. Sur Personnel, vérifiez que le bouton "Ajouter un employé" est masqué
4. Vérifiez que le badge "Mode lecture seule" s'affiche
5. Essayez d'accéder directement à `dashboard.html` → redirection automatique

## 🔧 Personnalisation

Pour modifier les permissions, éditez `js/role-access-control.js` :

```javascript
const ROLE_PERMISSIONS = {
    'dispatcher': {
        pages: {
            'dashboard.html': false,  // Modifier ici
            'planif.html': true,      // Modifier ici
            // ...
        },
        canEditPersonnel: false,     // Modifier ici
        // ...
    }
};
```


