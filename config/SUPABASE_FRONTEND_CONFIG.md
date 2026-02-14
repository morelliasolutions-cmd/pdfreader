# Configuration Supabase pour Frontend et n8n

## 🔗 URLs et Accès

### Supabase API (pour frontend/n8n)
- **URL API** : `http://78.47.97.137:8000`
- **URL Studio** : `http://78.47.97.137:3001`
- **Protocol** : HTTP (pour l'instant)

### Clés API Supabase

⚠️ **IMPORTANT** : Ces clés sont actuellement les clés par défaut. Vous devez les régénérer dans Supabase Studio après la première connexion !

**Clé Anon (publique - à utiliser dans le frontend)** :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

**Clé Service Role (secrète - uniquement serveur/n8n)** :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

## 📋 Configuration Frontend

### Variables d'environnement Frontend

Créez un fichier `.env` dans votre frontend :

```bash
# Supabase Configuration
SUPABASE_URL=http://78.47.97.137:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### Exemple d'initialisation Supabase Client (JavaScript/TypeScript)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://78.47.97.137:8000'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Exemple d'utilisation

```javascript
// Authentification
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Requête base de données
const { data, error } = await supabase
  .from('ma_table')
  .select('*')

// Insertion
const { data, error } = await supabase
  .from('ma_table')
  .insert([{ nom: 'test', email: 'test@example.com' }])

// Update
const { data, error } = await supabase
  .from('ma_table')
  .update({ nom: 'nouveau_nom' })
  .eq('id', 1)

// Delete
const { data, error } = await supabase
  .from('ma_table')
  .delete()
  .eq('id', 1)
```

## 🔒 Row Level Security (RLS)

### Vérifier que RLS est activé

Dans Supabase Studio → **Table Editor** → Sélectionnez une table → **Settings** → Vérifiez que **Enable Row Level Security** est activé.

### Politiques RLS importantes

#### 1. Politique SELECT (lecture)

Permet aux utilisateurs authentifiés de lire leurs propres données :

```sql
CREATE POLICY "Users can view own data"
ON ma_table
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### 2. Politique INSERT (insertion)

Force le `user_id` à l'ID de l'utilisateur connecté :

```sql
CREATE POLICY "Users can insert own data"
ON ma_table
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

#### 3. Politique UPDATE (modification)

Permet de modifier uniquement ses propres données :

```sql
CREATE POLICY "Users can update own data"
ON ma_table
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 4. Politique DELETE (suppression)

Permet de supprimer uniquement ses propres données :

```sql
CREATE POLICY "Users can delete own data"
ON ma_table
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### Politique publique (lecture seule pour tous)

Pour des données publiques en lecture seule :

```sql
CREATE POLICY "Public read access"
ON ma_table
FOR SELECT
TO anon, authenticated
USING (true);
```

## 🔐 Authentification

### Configuration Auth dans Supabase Studio

1. Accédez à Supabase Studio : `http://78.47.97.137:3001`
2. Allez dans **Authentication** → **Settings**
3. Vérifiez les configurations :
   - **Site URL** : `http://78.47.97.137:3001`
   - **Additional Redirect URLs** : Ajoutez l'URL de votre frontend
   - **Enable Email Signup** : Activé (selon vos besoins)
   - **Enable Email Autoconfirm** : Désactivé (nécessite confirmation)

### Gérer les utilisateurs

Dans Supabase Studio → **Authentication** → **Users** :
- Créer un utilisateur
- Modifier un utilisateur
- Supprimer un utilisateur
- Réinitialiser le mot de passe

## 🤖 Configuration n8n

### 1. Installation du node Supabase pour n8n

Si n8n est déjà installé sur votre serveur, le node Supabase devrait être disponible par défaut.

### 2. Configuration dans n8n

#### Credentials Supabase dans n8n

1. Dans n8n, allez dans **Credentials**
2. Créez une nouvelle credential **Supabase**
3. Configurez :
   - **Host** : `78.47.97.137:8000` (sans `http://`)
   - **Service Role Secret** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q`

⚠️ **Note** : Pour n8n, utilisez la **Service Role Key** (pas la clé anon) pour avoir accès complet à la base de données.

#### Nodes Supabase disponibles dans n8n

1. **Supabase - Database** : Interroger, insérer, mettre à jour, supprimer des données
2. **Supabase - Auth** : Gérer l'authentification (créer utilisateur, réinitialiser mot de passe, etc.)
3. **Supabase - Storage** : Gérer les fichiers dans Storage

### 3. Exemple de workflow n8n avec Supabase

#### Workflow simple : Insérer des données

1. Créez un nouveau workflow dans n8n
2. Ajoutez un trigger (Webhook, Schedule, etc.)
3. Ajoutez le node **Supabase - Database**
4. Configurez :
   - **Operation** : `Insert`
   - **Table** : `votre_table`
   - **Columns** : Sélectionnez les colonnes à insérer
   - Mappez les valeurs depuis le node précédent
5. Testez et activez le workflow

#### Workflow : Requête de données

1. Ajoutez le node **Supabase - Database**
2. Configurez :
   - **Operation** : `Select`
   - **Table** : `votre_table`
   - **Return All** : `true` ou configurez des filtres
3. Traitez les résultats dans le node suivant

#### Workflow : Authentification utilisateur

1. Ajoutez le node **Supabase - Auth**
2. Configurez :
   - **Operation** : `Sign Up` ou `Sign In`
   - **Email** : depuis le node précédent
   - **Password** : depuis le node précédent
3. Récupérez le token JWT retourné

### 4. Connection string PostgreSQL pour n8n (si nécessaire)

Si vous utilisez un node PostgreSQL direct dans n8n au lieu du node Supabase :

```
Host: 78.47.97.137
Port: 5432
Database: postgres
User: postgres
Password: q7PVChcIAu8bOrGK
```

⚠️ **ATTENTION** : Cette connexion PostgreSQL directe bypass RLS. Utilisez-la uniquement si nécessaire et avec précaution.

## 🔍 Vérification de la connexion

### Test depuis le frontend

```javascript
// Test de connexion
const { data, error } = await supabase
  .from('_test_connection')
  .select('*')
  .limit(1)

if (error) {
  console.error('Erreur de connexion:', error)
} else {
  console.log('✅ Connexion réussie !')
}
```

### Test depuis n8n

1. Créez un workflow de test
2. Ajoutez un node **Supabase - Database**
3. Configurez **Operation** : `Select` sur une table existante
4. Exécutez le workflow
5. Vérifiez que les données sont retournées

### Test API REST direct

```bash
curl -X GET "http://78.47.97.137:8000/rest/v1/votre_table?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ⚠️ Points de sécurité importants

1. **Ne jamais exposer la Service Role Key dans le frontend**
2. **Toujours activer RLS sur les tables sensibles**
3. **Utiliser la clé Anon dans le frontend**
4. **Utiliser la Service Role Key uniquement côté serveur (n8n, Edge Functions, etc.)**
5. **Changer les clés par défaut après la première configuration**
6. **Utiliser HTTPS en production** (configurer un reverse proxy avec SSL)

## 📝 Checklist de configuration

- [x] .env Supabase corrigé (localhost → IP publique)
- [x] .env envoyé sur le serveur
- [x] Supabase redémarré
- [ ] Clés API régénérées dans Supabase Studio (recommandé)
- [ ] Frontend configuré avec SUPABASE_URL et SUPABASE_ANON_KEY
- [ ] RLS activé sur toutes les tables sensibles
- [ ] Politiques RLS créées pour chaque table
- [ ] n8n configuré avec Service Role Key
- [ ] Workflow n8n testé
- [ ] HTTPS configuré (reverse proxy avec certificat SSL)

## 📚 Ressources

- [Documentation Supabase Client](https://supabase.com/docs/reference/javascript/introduction)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation n8n Supabase Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/)
- [Supabase Studio](http://78.47.97.137:3001)
