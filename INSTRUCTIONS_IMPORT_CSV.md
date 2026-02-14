# Instructions d'import du CSV user_roles

## 📋 Fichiers créés

1. **`user_roles_import.csv`** - Fichier CSV prêt à importer
2. **`create_employees_first.sql`** - Script pour créer les employés (déjà exécuté)

## ✅ Étape 1 : Vérifier que les employés existent

Les employés ont été créés automatiquement. Si besoin, exécutez :
```sql
-- Voir les employés créés
SELECT id, email, first_name || ' ' || last_name as name
FROM employees
WHERE email IN (
  'admin@morellia.ch',
  'chefdechantier@morellia.ch',
  'contact@morellia.ch',
  'dispatcher@morellia.ch',
  'florian.lejeune@morellia.ch',
  'technicien@morellia.ch',
  'technicien@velox.ch'
);
```

## 📥 Étape 2 : Importer le CSV dans Supabase

### Option A : Via l'interface Supabase (Recommandé)

1. **Ouvrez votre projet Supabase**
2. Allez dans **Table Editor** → **user_roles**
3. Cliquez sur **"Insert"** → **"Import data from CSV"**
4. Sélectionnez le fichier **`user_roles_import.csv`**
5. Vérifiez que les colonnes correspondent :
   - `user_id` → user_id (UUID)
   - `employee_id` → employee_id (UUID)
   - `role` → role (TEXT)
6. Cliquez sur **"Import"**

### Option B : Via SQL (Alternative)

Si l'import CSV ne fonctionne pas, utilisez cette requête SQL :

```sql
-- Importer les rôles via SQL
INSERT INTO user_roles (user_id, employee_id, role)
VALUES 
  ('f269b57b-fa35-4468-9d77-908001e413be', '1e3f36bd-0668-4242-855d-a7601375059e', 'admin'),
  ('bafbf408-1cd8-498c-9f49-9712f2d158de', '2eed1756-a5da-45ec-9e80-e139a31a7254', 'chef_chantier'),
  ('a025d4f1-c6c4-4eb1-a0b4-75a3060a9784', '1231c6f4-8294-4f6f-a9ff-9877b659793f', 'dispatcher'),
  ('3b40d989-979f-40e5-8701-dae6477f938c', '2021d908-fddb-45b6-b97e-60bb777fa0d5', 'dispatcher'),
  ('01c28629-3bab-4560-a1e9-ad9dea29bfab', 'ba0e2632-c7c9-4736-9b4f-e19f30775b51', 'technicien'),
  ('97aff518-500e-44e1-8714-c6f87b3e5212', '6528fc39-36d9-4430-95ef-a029479f2bfc', 'technicien'),
  ('31027ed2-ebfe-4c05-8bc2-e2b6f094fdf6', 'd019564f-1580-4eb4-9691-8e812cb40401', 'technicien')
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = NOW();
```

## ✅ Étape 3 : Vérifier l'import

Exécutez cette requête pour vérifier que les rôles ont été attribués :

```sql
SELECT 
  u.email as email_utilisateur,
  e.first_name || ' ' || e.last_name as nom_employe,
  ur.role,
  ur.created_at as attribue_le
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN employees e ON ur.employee_id = e.id
ORDER BY ur.role, u.email;
```

## 📊 Résumé des rôles attribués

| Email | Rôle |
|-------|------|
| admin@morellia.ch | admin |
| chefdechantier@morellia.ch | chef_chantier |
| dispatcher@morellia.ch | dispatcher |
| contact@morellia.ch | dispatcher |
| florian.lejeune@morellia.ch | technicien |
| technicien@morellia.ch | technicien |
| technicien@velox.ch | technicien |

## ⚠️ Notes importantes

- Le fichier CSV contient uniquement les colonnes nécessaires (`user_id`, `employee_id`, `role`)
- Les colonnes `id`, `created_at` et `updated_at` seront auto-générées par Supabase
- Si un rôle existe déjà, l'import SQL avec `ON CONFLICT` le mettra à jour
- Assurez-vous que les employés existent avant d'importer (déjà fait)

## 🔄 Pour modifier un rôle après import

```sql
UPDATE user_roles
SET role = 'nouveau_role'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email@example.com');
```


