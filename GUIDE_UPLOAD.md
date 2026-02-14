# 📤 Guide d'Upload en Ligne - Veloxnumeric Web App

## 📁 Structure des fichiers à uploader

### Structure sur le serveur web

```
votre-serveur.com/
│
├── index.html                    ← Page de login
├── dashboard.html                ← Tableau de bord
├── pointage.html                 ← Pointage des heures
├── personnel.html                ← Gestion du personnel
├── production.html               ← Suivi production
├── planif.html                   ← Planning des rendez-vous
├── parametres.html               ← Paramètres web app principale (profil utilisateur)
│
├── inventaire/                   ← 📁 SOUS-DOSSIER OBLIGATOIRE
│   ├── inventaire.html           ← Gestion des stocks
│   ├── collaborateurs.html      ← Gestion techniciens et matériel
│   ├── vehicule.html             ← Gestion de la flotte
│   ├── parametres.html           ← Paramètres inventaire (dépôts, logo)
│   └── index.html                ← (optionnel, page d'accueil inventaire)
│
├── js/                           ← Dossier JavaScript
│   ├── config.js                 ← Configuration Supabase
│   └── api.js                    ← VeloxAPI
│
└── css/                          ← Dossier CSS (optionnel)
    └── styles.css
```

## ✅ Fichiers à uploader dans le dossier `inventaire/`

**Obligatoires :**
- ✅ `inventaire.html` - Gestion des stocks par dépôt
- ✅ `collaborateurs.html` - Gestion des techniciens et matériel
- ✅ `vehicule.html` - Gestion de la flotte
- ✅ `parametres.html` - Paramètres du module inventaire (dépôts)

**Optionnels (si vous les utilisez) :**
- `index.html` - Page d'accueil du module inventaire
- `technicien.html` - (si utilisé)
- `materiel_collaborateur.html` - (si utilisé)
- `template_materiel.html` - (si utilisé)

## 🔗 Explication des liens

### Dans la web app principale (racine)
Les fichiers à la racine (`dashboard.html`, `pointage.html`, etc.) ont des liens vers :
- `inventaire/inventaire.html` ← Lien vers le module inventaire

### Dans le module inventaire (`inventaire/`)
Les fichiers dans `inventaire/` utilisent des liens relatifs :
- `inventaire.html` ← Lien vers la page inventaire (même dossier)
- `collaborateurs.html` ← Lien vers collaborateurs (même dossier)
- `vehicule.html` ← Lien vers véhicules (même dossier)
- `parametres.html` ← Lien vers paramètres inventaire (même dossier)
- `../js/config.js` ← Lien vers le dossier js à la racine
- `../js/api.js` ← Lien vers le dossier js à la racine

## 📋 Checklist d'upload

### Étape 1 : Upload des fichiers racine
- [ ] `index.html`
- [ ] `dashboard.html`
- [ ] `pointage.html`
- [ ] `personnel.html`
- [ ] `production.html`
- [ ] `planif.html`
- [ ] `parametres.html` ← **Paramètres web app principale**

### Étape 2 : Créer le dossier `inventaire/`
- [ ] Créer le dossier `inventaire/` sur votre serveur

### Étape 3 : Upload des fichiers dans `inventaire/`
- [ ] `inventaire/inventaire.html`
- [ ] `inventaire/collaborateurs.html`
- [ ] `inventaire/vehicule.html`
- [ ] `inventaire/parametres.html` ← **Paramètres inventaire (différent !)**

### Étape 4 : Upload des dossiers
- [ ] `js/config.js`
- [ ] `js/api.js`
- [ ] `css/styles.css` (si utilisé)

## ⚠️ Points importants

1. **Deux fichiers `parametres.html` différents :**
   - `/parametres.html` → Paramètres de la web app principale (profil utilisateur)
   - `/inventaire/parametres.html` → Paramètres du module inventaire (dépôts, logo)

2. **Les liens sont déjà configurés :**
   - Les fichiers dans `inventaire/` utilisent des chemins relatifs (`../js/config.js`)
   - Les fichiers à la racine pointent vers `inventaire/inventaire.html`

3. **Structure des dossiers :**
   ```
   votre-serveur/
   ├── inventaire/          ← Créer ce dossier
   │   └── *.html           ← Mettre les fichiers HTML dedans
   ├── js/                  ← Dossier à la racine
   └── css/                 ← Dossier à la racine (optionnel)
   ```

## 🚀 Exemple d'upload (FTP/SSH)

```bash
# Structure sur votre serveur
/public_html/
  ├── index.html
  ├── dashboard.html
  ├── ...
  ├── inventaire/          ← Créer ce dossier
  │   ├── inventaire.html
  │   ├── collaborateurs.html
  │   ├── vehicule.html
  │   └── parametres.html
  ├── js/
  │   ├── config.js
  │   └── api.js
  └── css/
      └── styles.css
```

## ✅ Vérification après upload

1. Tester le lien "Inventaire" depuis `dashboard.html` → doit ouvrir `inventaire/inventaire.html`
2. Tester les liens dans `inventaire/inventaire.html` → doivent fonctionner (collaborateurs, véhicules, paramètres)
3. Vérifier que les scripts JS se chargent (`../js/config.js`)

## 📝 Notes

- Les fichiers SQL (migrations) ne doivent **PAS** être uploadés sur le serveur web
- Les fichiers `.md` (documentation) ne sont pas nécessaires en production
- Seuls les fichiers HTML, JS, CSS sont nécessaires pour le fonctionnement


