# ⚠️ URGENT : Créer la table `appointments` dans Supabase

## 🚨 Erreur détectée

Vous avez une **erreur 404** lors de l'ajout de rendez-vous dans le Planning car **la table `appointments` n'existe pas encore dans votre base de données Supabase**.

```
Failed to load resource: the server responded with a status of 404 ()
wdurkaelytgjbcsmkzgb.supabase.co/rest/v1/appointments
```

---

## ✅ Solution : Exécuter le script SQL

### Étape 1 : Ouvrez Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2 : Copiez et exécutez ce script

Ouvrez le fichier **`CREATE_APPOINTMENTS_TABLE.sql`** dans votre dossier `veloxnumeric-web/` et copiez tout son contenu, puis collez-le dans l'éditeur SQL de Supabase.

**OU** copiez directement ce script :

```sql
-- Créer la table appointments pour le planning des interventions
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity TEXT NOT NULL,
    mandate_number TEXT NOT NULL,
    client_name TEXT,
    phone TEXT,
    address TEXT NOT NULL,
    npa TEXT,
    city TEXT,
    note TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Activer RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Direction, Chef de chantier, Dispatcher peuvent voir tous les rendez-vous
CREATE POLICY "Direction/Chef/Dispatcher peuvent voir les rendez-vous"
ON appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM roles 
        WHERE user_email = auth.jwt() ->> 'email' 
        AND role_name IN ('direction', 'chef_de_chantier', 'dispatcher')
    )
);

-- Politique SELECT : Techniciens peuvent voir leurs propres rendez-vous
CREATE POLICY "Techniciens peuvent voir leurs rendez-vous"
ON appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees e
        JOIN roles r ON r.user_email = e.email
        WHERE e.id = appointments.employee_id
        AND r.user_email = auth.jwt() ->> 'email'
        AND r.role_name = 'technicien'
    )
);

-- Politique INSERT : Direction, Chef de chantier, Dispatcher peuvent créer des rendez-vous
CREATE POLICY "Direction/Chef/Dispatcher peuvent créer des rendez-vous"
ON appointments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM roles 
        WHERE user_email = auth.jwt() ->> 'email' 
        AND role_name IN ('direction', 'chef_de_chantier', 'dispatcher')
    )
);

-- Politique UPDATE : Direction, Chef de chantier, Dispatcher peuvent modifier des rendez-vous
CREATE POLICY "Direction/Chef/Dispatcher peuvent modifier des rendez-vous"
ON appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM roles 
        WHERE user_email = auth.jwt() ->> 'email' 
        AND role_name IN ('direction', 'chef_de_chantier', 'dispatcher')
    )
);

-- Politique DELETE : Direction, Chef de chantier, Dispatcher peuvent supprimer des rendez-vous
CREATE POLICY "Direction/Chef/Dispatcher peuvent supprimer des rendez-vous"
ON appointments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM roles 
        WHERE user_email = auth.jwt() ->> 'email' 
        AND role_name IN ('direction', 'chef_de_chantier', 'dispatcher')
    )
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at();
```

### Étape 3 : Cliquez sur "Run" (Exécuter)

Le script va créer :
- ✅ La table `appointments`
- ✅ Les politiques RLS (sécurité)
- ✅ Les index pour les performances
- ✅ Un trigger pour les mises à jour automatiques

---

## 🎯 Après l'exécution

1. **Rechargez votre page Planning** (`planif.html`)
2. **Testez l'ajout d'un rendez-vous** en cliquant sur le bouton "+" bleu
3. **L'erreur 404 devrait disparaître** ! ✅

---

## ❓ Si le problème persiste

1. Vérifiez que vous êtes bien connecté à Supabase
2. Vérifiez que la table `roles` existe (créée précédemment avec `SETUP_RLS.sql`)
3. Videz le cache de votre navigateur (`Ctrl+Shift+R`)
4. Vérifiez la console du navigateur pour d'autres erreurs

---

**✨ Bonne chance !**


