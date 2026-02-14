**Documentation d'import des mandats (CSV / Excel)**

Version: 2026-02-11

Résumé
------
- Objectif : documenter en détail le mécanisme d'import présent dans `mandats.html`, expliquer le mapping des colonnes du fichier CSV/Excel vers la table `appointments`, décrire les fonctions clés, la logique de nettoyage/merge, et fournir des instructions de test et dépannage.
- Fichiers principaux référencés : `mandats.html`, `export11.02.2026 12_05_34.csv` (exemple), SQL : table `appointments`.

1) Vue d'ensemble du flux
-------------------------
- L'utilisateur dépose (drag & drop) un fichier CSV (séparateur `;`) ou un fichier Excel (.xlsx) dans l'interface présentée par `mandats.html`.
- Le front-end lit le fichier :
  - pour CSV : `parseCsvSemicolon(text)` après lecture de l'ArrayBuffer avec `decodeWithFallback` (essaye `windows-1252`, sinon `utf-8`).
  - pour Excel : SheetJS (`XLSX.read`) puis `XLSX.utils.sheet_to_json`.
- Le jeu de lignes lu est normalisé et parfois fusionné (`mergeOrderTypeRows`) pour coller au format attendu.
- Chaque ligne devient un objet normalisé (clés en minuscules via `normalizeRow`) et est mappée en un objet `appointment` via `mapRowsToAppointments`.
- Les appointments validés sont importés dans Supabase via `importAppointmentsToSupabase`, qui effectue un comportement d'`upsert` intelligent :
  - crée des nouveaux enregistrements pour les `mandate_number` inconnus
  - met à jour uniquement les champs vides des enregistrements existants (ne remplace pas les données déjà présentes)

2) Décodage CSV / encodage
--------------------------
- `decodeWithFallback(arrayBuffer)` : tente `windows-1252` puis `utf-8`.
- Le parser CSV interne (`parseCsvSemicolon`) est conçu pour gérer :
  - séparateur `;`
  - champs entre guillemets `"` avec échappement `""`
  - retours chariot `\r` et `\n`
- Si votre fichier CSV ne contient pas de `;`, l'analyse échouera (colonnes jointes). Vérifier l'export source (systèmes internes exportent souvent en `;` pour les locaux Windows).

3) Fusion des lignes `Order Type`
--------------------------------
- Contexte : certains exports placent la valeur `Order Type` sur une ligne suivante (ligne presque vide). La fonction `mergeOrderTypeRows(rows)` détecte ces cas et fusionne la valeur `Order Type` dans la ligne principale.
- Détection effectuée par `isOrderTypeOnlyRow(currentRow, nextRow)` qui compte les champs vides.

4) Normalisation des clés
-------------------------
- `normalizeRow(row)` transforme chaque clé en `key.trim().toLowerCase()` pour rendre les recherches insensibles à la casse et aux espaces superflus.
- Ex. : colonne CSV "Info SE" devient clé "info se".

5) Mapping colonnes CSV → champs `appointments`
------------------------------------------------
Extrait de la logique (`mapRowsToAppointments`) — champs créés :

- `mandate_number`  <-- CSV `Order ID`  (clés testées : `order id`, `orderid`)
- `client_name`     <-- CSV `Execution Location` (clé : `execution location`)
- `phone`           <-- CSV `Phone` ou `Mobile` (priorité Phone puis Mobile)
- `email`           <-- extrait des colonnes textuelles `Info SE` et `Info IDC` (voir section extraction d'email)
- `address`         <-- CSV `Street` (clé : `street`)
- `npa`             <-- CSV `Zip` (clé : `zip`)
- `city`            <-- CSV `City` (clé : `city`)
- `canton`          <-- CSV `Region` (clé : `region`) — stocké dans la colonne `canton` de la table
- `date`            <-- NE PAS IMPORTER la date du fichier Excel (toujours `null`). La planification doit être faite via `planif.html`.
- `pto_reference`   <-- CSV `Socket Label` (clé : `socket label`)
- `tu`              <-- CSV `BU` (clé : `bu`) — correspond au TU ajouté au schéma
- `note`            <-- construit à partir de `Order Type` et `dateReference` si présents
- `activity`        <-- valeur fournie par l'UI (type de mandat: `swisscom`, `pully4net`, ...)

Remarques sur les clés: `getValue(normalized, [...])` teste une liste d'alternatives (variantes orthographiques et formats avec `_`).

6) Extraction d'email
---------------------
- Les emails sont extraits avec `extractEmail(text)` :
  - si `text` est vide : renvoie `''`.
  - utilise une regex robuste pour capturer des adresses au format usuel (prise en compte des caractères spéciaux standards avant le `@`, et des domaines avec `.`).
  - renvoie le premier match trouvé, mis en minuscule.
- Important : le code concatène maintenant `Info SE` + `Info IDC` avant la recherche. Cela évite de rater un email si `Info SE` contient du texte non-email (ex: `AXS`) et `Info IDC` contient l'email.

Regex utilisée (simplifiée dans la doc) :

```
/[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/g
```

Exemples observés dans `export11.02.2026 12_05_34.csv` :
- Ligne 2 : `Comment: Email : tefanimarunovic@bluewin.ch` → extrait `tefanimarunovic@bluewin.ch`
- Ligne 3 : `Comment: Email : sylviamenoud@hotmail.fr` → extrait `sylviamenoud@hotmail.fr`

7) Fonctions utilitaires clés
-----------------------------
- `getValue(obj, keys)` : renvoie la première valeur non vide parmi les clés listées dans `keys` appliquées à l'objet `obj` (les clés doivent être déjà normalisées)
- `parseDate(value)` : détecte `DD.MM.YYYY` ou ISO `YYYY-MM-DD` et renvoie `YYYY-MM-DD` sinon `''`.

8) Import vers Supabase (smart merge)
------------------------------------
- `importAppointmentsToSupabase(appointments)` :
  - récupère en base tous les `appointments` dont le `mandate_number` est présent dans l'import
  - sépare nouveaux (`toInsert`) et existants (`toUpdate`)
  - `INSERT` par batch (100)
  - pour `UPDATE` : ne met à jour que les champs vides dans la base, afin de préserver les données manuellement renseignées (ex: `email`, `client_name`, `address` si déjà présents ne seront pas écrasés)
- En cas d'erreur Supabase, la fonction logue et affiche une erreur via `showErrorToast`.

9) Schéma / colonnes DB importantes
----------------------------------
- Table : `appointments` (extraits utiles) :
  - `id` (pk)
  - `mandate_number` (varchar)  ← mappe `Order ID`
  - `client_name`
  - `phone`
  - `email`
  - `address`
  - `npa`
  - `city`
  - `canton` ← nouvelle colonne utilisée pour `Region`
  - `pto_reference`
  - `tu` ← nouvelle colonne pour `BU`
  - `date` (doit rester NULL à l'import)
  - `note`
  - `activity`
  - `created_at`, `updated_at`

10) Tests et validation
-----------------------
- Etapes manuelles :
  1. Ouvrir `mandats.html` dans le navigateur (serveur local ou fichier ouvert selon setup).
  2. Glisser-déposer `export11.02.2026 12_05_34.csv` dans la zone d'import.
  3. Ouvrir la console devtools (F12) et vérifier les logs :
     - log attendu au premier enregistrement : `🔍 TOUTES les colonnes normalisées: [...]` (liste des clés détectées)
     - si les colonnes attendues ne figurent pas, copier la sortie et vérifier la casse/espaces.
  4. Vérifier la table `appointments` (via Supabase UI ou SQL) pour s'assurer que les enregistrements insérés contiennent `mandate_number` et `email`.

- Commande SQL utile (exemples) :

```sql
-- Vider la table (test)
DELETE FROM appointments;

-- Vérifier les premiers enregistrements
SELECT mandate_number, client_name, email, phone FROM appointments LIMIT 50;
```

11) Dépannage / FAQ
-------------------
- Aucun email extrait :
  - Ouvrir console → vérifier la sortie `🔍 TOUTES les colonnes normalisées:` pour confirmer le nom exact des colonnes (ex: `info se` ou `info_se` ou `infose`).
  - Si la colonne contient plusieurs lignes concaténées avec retours à la ligne (ex: `axs\n+41 798...`), la regex doit quand même trouver l'email si présent. Si non, copier le texte et tester la regex via console : `extractEmail("votre texte ici")`.
  - Vérifier l'encodage : si accents ou caractères spéciaux corrompus (ex: `Ren�`), retester l'export en UTF-8 ou Windows-1252.
- Colonnes manquantes ou renommées :
  - Adapter les alternatives passées à `getValue` dans `mapRowsToAppointments` (ex: ajouter 'infos se', 'infose', etc.).
- CSV non détecté comme `;`-separé :
  - Vérifier l'export origine : si le séparateur est `,`, adapter `parseCsvSemicolon` ou exporter en `;`.

12) Points de sécurité et bonnes pratiques
----------------------------------------
- Ne jamais stocker de clefs privées dans le front-end. Seules `SUPABASE_URL` et `SUPABASE_ANON_KEY` doivent être utilisées côté client.
- RLS (Row Level Security) : s'assurer que les policies supabase sont en place pour que chaque utilisateur ne voit que ses données si nécessaire.

13) Emplacements dans le dépôt
-----------------------------
- Code d'import / mapping : [mandats.html](mandats.html#L1)
- Exemple CSV utilisé pour tests : [export11.02.2026 12_05_34.csv](export11.02.2026%2012_05_34.csv#L1)
- Guides et politiques relatives à Supabase : [AGENTS.md](AGENTS.md#L1) et [SETUP_RLS.sql](SETUP_RLS.sql#L1) (vérifier RLS côté DB)

14) Exemple concret (ligne CSV → résultat attendu)
-------------------------------------------------
CSV (extrait) :

"Clean";"SINGLE TASK";"24879707";"1";"03-DISPO";"RLA MultiNet Communication GmbH";"FIO Customer Driven";"17.03.2026 09:58";"AXS";"SNC TEFANI, Marunovic Ljubisa et Dragana Ljubisa";"1565";"Missy";"rte de Carignan 29 " ;"Fribourg_RLA";"";" +41 266670563";"Comment: Email : tefanimarunovic@bluewin.ch"

Mapping produit :
- `mandate_number`: 24879707
- `client_name`: SNC TEFANI, Marunovic Ljubisa et Dragana Ljubisa
- `npa`: 1565
- `city`: Missy
- `address`: rte de Carignan 29
- `canton`: Fribourg_RLA
- `phone`: +41 266670563
- `email`: tefanimarunovic@bluewin.ch
- `tu`: RLA MultiNet Communication GmbH

15) Modifications fréquentes à apporter si besoin
------------------------------------------------
- Ajouter variantes de clés dans `getValue(normalized, [...])` pour correspondre aux headers réels.
- Ajuster `extractEmail` si vous avez des formats non-standards (ex: email encodés, séparateurs non classiques).
- Si des lignes Order Type sont mal fusionnées, ajuster `isOrderTypeOnlyRow` pour détecter correctement la structure.

Contact / suite
----------------
Si vous voulez, je peux :
- générer des tests unitaires côté front (petit runner JS) pour valider l'extraction d'email,
- automatiser une tâche de nettoyage/normalisation des CSV avant import,
- ou modifier `mapRowsToAppointments` pour supporter d'autres variantes d'exports (ex: colonnes supplémentaires).

Fin de la documentation.
