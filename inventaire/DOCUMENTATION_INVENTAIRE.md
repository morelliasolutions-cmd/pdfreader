# Documentation — Page Inventaire
# Documentation — Page Inventaire

## `inventaire.html`

---

## 📋 Vue d'ensemble

Page de gestion de l'inventaire destinée à l'interface web Veloxnumeric. Permet de lister, ajouter, modifier, supprimer des articles, exporter en Excel et gérer les dépôts.

Type: Page web (HTML/JS)
Framework CSS: Tailwind (CDN)
Backend: Supabase (JS SDK)

---

## 🧭 Composants principaux

- Navigation horizontale (liens vers `inventaire`, `technicien`, `vehicule`, `commandes`).
- Header: titre, sélecteur de dépôt, boutons `Exporter Excel` et `Ajouter un article`.
- KPI (statistiques): total articles, en stock, seuil bas, hors stock, valeur totale.
- Champ de recherche (filtrage en temps réel).
- Tableau des articles (photo, référence, nom, catégorie, fournisseur, quantité, seuil, prix, prix total, recommandé, actions).
- Modal d'ajout / modification d'article (formulaire complet).

---

## 🔗 Fichiers et dépendances

- Fichier HTML: `inventaire/inventaire.html`
- CSS/Framework: Tailwind via CDN (chargé en top de page)
- Librairies externes:
  - `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` (client Supabase)
  - `https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js` (export Excel)
  - Google Fonts & Material Symbols
- Scripts locaux (doivent être uploadés sur le serveur):
  - `../js/config.js` (initialisation Supabase — IMPORTANT)
  - `../js/api.js` (wrapper API/Helpers)
  - `../js/role-access-control.js` (gestion des rôles)

Remarque importante: si la page s'affiche localement mais pas sur Hostinger, vérifiez que les fichiers `js/` et `css/` référencés ont bien été uploadés et que les chemins relatifs sont corrects.

---

## 🏗️ Structure HTML et points d'intégration

- `#loading` : zone d'affichage d'un écran de chargement.
- `#main-content` : conteneur principal (masqué pendant le chargement).
- `nav` : barre de navigation (liens avec classe `.nav-link`).
- `#depot-selector` : select pour choisir le dépôt actif.
- `#export-excel-btn` : bouton pour exporter l'inventaire (utilise SheetJS).
- `#add-btn` : ouvre le modal d'ajout.
- `#stats-container` : cartes de KPI (`#stat-total`, `#stat-ok`, `#stat-low`, `#stat-empty`, `#stat-total-value`).
- `#search-input` : input de recherche (filtre `allInventoryData`).
- `#table-body` : tbody du tableau; rendu dynamique via `renderTable(data)`.
- Modal: `#modal`, formulaire `#item-form`, champs identifiés par `id` (`reference`, `name`, `category`, `supplier`, `price`, `quantity`, `threshold`, `weekly_need`, `photo`, `website_url`).

---

## ⚙️ Comportement JavaScript (flux de données)

1. Initialisation:
   - `config.js` doit définir `window.SUPABASE_CONFIG` et initialiser `window.supabase` ou permettre la création via `supabase.createClient(...)`.
   - `DOMContentLoaded` lance `showLoading()`, attend l'initialisation de Supabase, récupère la session et appelle `loadDepots()`.

2. Chargement des dépôts:
   - `loadDepots()` lit la table `depots` depuis Supabase, remplit `#depot-selector` et sauvegarde la sélection dans `localStorage`.

3. Chargement des articles:
   - `loadData()` lit `inventory_items` filtré par `depot_id`, calcule `recommended` (besoin hebdomadaire × nombre de techniciens actifs) et alimente `allInventoryData`.
   - `renderTable(allInventoryData)` met à jour le DOM (`#table-body`).

4. Actions CRUD:
   - Création / Modification: `itemForm` -> `supabase.from('inventory_items').insert()` ou `.update()`.
   - Suppression: `deleteItem(id)` -> `.delete().eq('id', id)`.
   - Mise à jour rapide quantité: `quickUpdateQuantity(id, newQuantity)` -> `.update({ quantity })`.

5. Export Excel:
   - `export-excel-btn` prépare un JSON, crée une worksheet via `XLSX.utils.json_to_sheet()` et télécharge le fichier.

6. Recherche/Filtre:
   - Filtre côté client via `search-input` sur `reference`, `name`, `category`, `supplier`.

---

## 🔐 Accès, sécurité et RLS

- La page vérifie la session Supabase avant d'afficher les données (redirection si non connecté).
- Les requêtes vers `depots`, `inventory_items`, `employees`, `user_roles` utilisent le client Supabase côté front.
- Recommandation: appliquer des policies RLS côté Supabase pour `inventory_items` et `depots` afin que seuls les rôles autorisés (admin, chef, dispatcher) puissent écrire/supprimer; techniciens peuvent lire.

Exemple minimal de policy (SELECT pour technicien):

```sql
CREATE POLICY "Technicien peut lire son dépôt"
ON inventory_items FOR SELECT
USING (depot_id IN (SELECT id FROM depots WHERE /* condition de visibilité */ true));
```

Adaptez les policies selon votre modèle de permissions (`user_roles`, `depots.access_list`, etc.).

---

## 🛠️ Déploiement & vérifications Hostinger (problèmes courants)

- Chemins relatifs: si vos pages sont dans `inventaire/` et vos scripts dans `js/`, `../js/config.js` est correct lorsque la racine du site contient `js/`. Après upload, vérifiez que le fichier existe à `https://votre-domaine.tld/js/config.js`.
- Permissions: assurez-vous que les fichiers ont des permissions lecture publiques.
- Console navigateur: ouvrez les DevTools (F12) → Console & Network. Recherchez:
  - 404 sur `config.js`, `api.js` ou autres — fichier manquant ou chemin incorrect.
  - Erreurs JS: variable `window.supabase` non définie → `config.js` absent ou non chargé.
  - Erreurs CORS si vous chargez des ressources depuis un domaine différent.
- Forcer le cache: après upload, faites Ctrl+F5 pour vider le cache.

---

## ✅ Tests recommandés

1. Vérifier la présence de `js/config.js`, `js/api.js`, `js/role-access-control.js` via l'URL complète.
2. Ouvrir `inventaire.html`, vérifier qu'aucune erreur n'apparaît dans la console.
3. Tester la connexion Supabase (affichage du `user-name`).
4. Valider que `#depot-selector` contient des dépôts et que `#table-body` se remplit.
5. Tester création, modification, suppression d'article.
6. Tester l'export Excel.

---

## 🔧 Résolution rapide (si affichage local OK mais hosté KO)

- Étape 1: vérifier que `js/` et `css/` ont été uploadés à l'emplacement attendu.
- Étape 2: ouvrir `https://votre-domaine.tld/inventaire/inventaire.html` et inspecter Network → filtrer `js` et `css`.
- Étape 3: corriger les chemins relatifs si nécessaire (ex: remplacer `../js/config.js` par `/js/config.js` si votre site est servi à la racine).
- Étape 4: vérifier que `config.js` expose bien `window.SUPABASE_CONFIG` et que les clés ne sont pas bloquées.

---

## 🗂️ Références de fichiers (workspace)

- `inventaire/inventaire.html` — page principale (this file)
- `js/config.js` — initialisation Supabase (obligatoire)
- `js/api.js` — fonctions utilitaires pour Supabase
- `js/role-access-control.js` — contrôles d'accès côté client

---

## ✍️ Ajouts possibles / amélioration

- Externaliser le JavaScript dans `js/inventaire.js` pour faciliter la maintenance et le cache.
- Ajouter des tests unitaires/back-end pour valider les policies RLS.
- Ajouter upload d'images (stockage Supabase Storage) plutôt que l'utilisation d'URL externes.

---

Si vous voulez, je peux:
- créer le fichier `inventaire/DOCUMENTATION_INVENTAIRE.md` (c'est fait),
- externaliser le JS dans `js/inventaire.js` et ajuster `inventaire.html`,
- ou vérifier les chemins pour l'upload Hostinger.

 Dites-moi la suite souhaitée.

 Détails ajoutés ci‑dessous : schéma SQL, exemples de policies RLS, extraits de code JS clés, procédure d'externalisation et guide de déploiement Hostinger.

 ---

 ## 1) Schéma SQL (tables principales)

 ### `inventory_items`
 ```sql
 CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    depot_id UUID REFERENCES depots(id) NOT NULL,
    reference TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    supplier TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 0,
    weekly_need INTEGER DEFAULT 0,
    monthly_need INTEGER DEFAULT 0,
    photo TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
 );
 ```

 ### `depots`
 ```sql
 CREATE TABLE depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
 );
 ```

 ### `employees` (extrait utile)
 ```sql
 CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    type TEXT,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
 );
 ```

 ---

 ## 2) Exemples de policies RLS (à adapter)

 Remarques: adapter les conditions à votre modèle `user_roles` / `depots.access`.

 Sélection: techniciens peuvent lire les items du dépôt visible
 ```sql
 ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "Technicien peut lire items de son dépôt"
 ON inventory_items FOR SELECT
 USING (
    EXISTS (
       SELECT 1 FROM depots d
       WHERE d.id = inventory_items.depot_id
       /* ajouter condition de visibilité, ex: d.id IN (SELECT depot_id FROM user_depots WHERE user_id = auth.uid()) */
    )
 );
 ```

 Insertion: seulement roles admin/chef
 ```sql
 CREATE POLICY "Admins peuvent insert"
 ON inventory_items FOR INSERT
 TO authenticated
 USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','chef_chantier')));
 ```

 Mise à jour: restreindre la modification aux rôles ou propriétaire du dépôt
 ```sql
 CREATE POLICY "Update restreint aux admins ou depot_owner"
 ON inventory_items FOR UPDATE
 USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','chef_chantier'))
 );
 ```

 ---

 ## 3) Extraits JS clés et explications

 - `loadDepots()` : charge la liste des dépôts (`depots`) et initialise `#depot-selector`.
 - `loadData()` : lit `inventory_items` filtrés par `depot_id`, calcule `recommended` et met à jour `allInventoryData`.
 - `renderTable(data)` : rend `#table-body` en DOM, gère les boutons d'édition/suppression/quantité.
 - `itemForm` submit handler : prépare `itemData` et utilise `supabase.from('inventory_items').insert()` ou `.update()`.
 - `quickUpdateQuantity(id, newQuantity)` : mise à jour rapide avec retour visuel immédiat.

 Exemple condensé (à copier dans la doc pour référence rapide) :
 ```javascript
 // Chargement items
 async function loadData() {
    const { data, error } = await supabase.from('inventory_items').select('*').eq('depot_id', currentDepotId);
    if (error) throw error;
    allInventoryData = (data||[]).map(i => ({ ...i, price: parseFloat(i.price||0) }));
    renderTable(allInventoryData);
 }

 // Sauvegarde depuis le formulaire
 itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemData = { /* ... */ };
    if (itemId) await supabase.from('inventory_items').update(itemData).eq('id', itemId);
    else await supabase.from('inventory_items').insert(itemData);
    await loadData();
 });
 ```

 ---

 ## 4) Externalisation du JS (Effectuée le 09/01/2026)

L'externalisation du code JavaScript a été réalisée pour améliorer la maintenabilité.

- **Fichier source** : `js/inventaire.js`
- **Intégration dans HTML** :
  ```html
  <script src="../js/config.js?v=8"></script>
  <script src="../js/api.js?v=8"></script>
  <script src="../js/role-access-control.js?v=1"></script>
  <script src="../js/inventaire.js?v=2"></script>
  ```
- **Points d'attention** :
  - Veillez à bien incrémenter le paramètre `?v=` lors des mises à jour pour éviter les problèmes de cache navigateur.
  - La fonction `showLoading()` utilise la concaténation de chaînes (et non les template literals) pour maximiser la compatibilité lors de l'injection dynamique.

### Mise à jour des permissions (Rôle Access Control)

Le fichier `js/role-access-control.js` gère l'affichage des éléments de navigation.

- **Rôle Dispatcher** :
  - Accès en lecture seule à `inventaire.html`.
  - Permission d'accès explicite ajoutée pour `commandes.html` (Nécessaire pour voir l'onglet "Commandes").

---

## 5) Guide de déploiement Hostinger — vérifications et corrections

 Vérifier les points suivants après upload :

 - Chemins relatifs : si le site est servi depuis la racine, préférer `/js/config.js` plutôt que `../js/config.js` selon l'emplacement de la page. Tester l'URL directe : `https://votre-domaine.tld/js/config.js`.
 - Fichiers présents : confirmer l'existence de `js/config.js`, `js/api.js`, `js/role-access-control.js`, `js/inventaire.js`.
 - Permissions : les fichiers doivent être lisibles publiquement (permission lecture).
 - Console navigateur (F12) → Network : filtrer `JS` et `CSS` pour voir les erreurs 404 ou 403.
 - Cache : effectuer Ctrl+F5 ou vider le cache CDN/Hostinger si nécessaire.

 Commandes de vérification (PowerShell) :
 ```powershell
 Invoke-WebRequest https://votre-domaine.tld/js/config.js -UseBasicParsing
 Invoke-WebRequest https://votre-domaine.tld/inventaire/inventaire.html -UseBasicParsing
 ```

 Erreurs courantes et résolutions :
 - 404 config.js → chemin incorrect : corriger le `src` dans `inventaire.html`.
 - `window.supabase` undefined → `config.js` non chargé ou erreur JS dans `config.js`.
 - CORS / Erreurs réseau → vérifier que les ressources sont servies depuis le même domaine ou config CORS côté API.

 ---

 ## Notes finales

 Cette section complète la documentation existante. Si vous voulez, je peux :

 - exporter les fragments SQL dans un fichier `supabase/schema_inventaire.sql`,
 - externaliser immédiatement le JS en créant `js/inventaire.js` et modifier `inventaire.html` (je peux le faire maintenant),
 - ou générer des policies RLS prêtes à appliquer (avec tests SQL).

 Indiquez l'action souhaitée (ex: "externaliser JS" ou "générer SQL") et je l'exécuterai.