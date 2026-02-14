-- ============================================
-- Script de correction des permissions RLS
-- Pour admin@morellia.ch
-- User ID: 62322acd-98d7-4bd5-883f-0ea690a49f56
-- ============================================

-- 1. Vérifier la structure de user_roles
\echo '1. Structure de user_roles:'
\d public.user_roles

-- 2. Vérifier la structure de employees
\echo '2. Structure de employees:'
\d public.employees

-- 3. Nettoyer et ajouter dans user_roles
\echo '3. Ajout dans user_roles...'
DELETE FROM public.user_roles WHERE user_id = '62322acd-98d7-4bd5-883f-0ea690a49f56';
INSERT INTO public.user_roles (user_id, role) VALUES ('62322acd-98d7-4bd5-883f-0ea690a49f56', 'admin');

-- 4. Vérifier/Ajouter dans employees
\echo '4. Ajout dans employees...'
INSERT INTO public.employees (id, email, role, is_active, first_name, last_name)
VALUES ('62322acd-98d7-4bd5-883f-0ea690a49f56', 'admin@morellia.ch', 'admin', true, 'Admin', 'Morellia')
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_active = true, email = 'admin@morellia.ch';

-- 5. Activer RLS sur toutes les tables importantes
\echo '5. Activation RLS...'
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- 6. Créer/Recréer les policies pour user_roles
\echo '6. Policies user_roles...'
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Créer/Recréer les policies pour employees
\echo '7. Policies employees...'
DROP POLICY IF EXISTS "Users can read own employee" ON public.employees;
CREATE POLICY "Users can read own employee" ON public.employees
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all employees" ON public.employees;
CREATE POLICY "Admins can read all employees" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
CREATE POLICY "Admins can update employees" ON public.employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Créer/Recréer les policies pour interventions
\echo '8. Policies interventions...'
DROP POLICY IF EXISTS "Admins can read all interventions" ON public.interventions;
CREATE POLICY "Admins can read all interventions" ON public.interventions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage interventions" ON public.interventions;
CREATE POLICY "Admins can manage interventions" ON public.interventions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Créer/Recréer les policies pour orders
\echo '9. Policies orders...'
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Créer/Recréer les policies pour absences
\echo '10. Policies absences...'
DROP POLICY IF EXISTS "Admins can read all absences" ON public.absences;
CREATE POLICY "Admins can read all absences" ON public.absences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage absences" ON public.absences;
CREATE POLICY "Admins can manage absences" ON public.absences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 11. Vérification finale
\echo '11. Vérification finale:'
SELECT 'user_roles:', user_id, role FROM public.user_roles WHERE user_id = '62322acd-98d7-4bd5-883f-0ea690a49f56';
SELECT 'employees:', id, email, role, is_active FROM public.employees WHERE id = '62322acd-98d7-4bd5-883f-0ea690a49f56';

\echo ''
\echo '============================================'
\echo 'Configuration terminée !'
\echo 'Vous pouvez maintenant vous reconnecter.'
\echo '============================================'
