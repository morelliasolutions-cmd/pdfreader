-- Script de création de toutes les tables pour Veloxnumeric
-- À exécuter dans l'ordre dans Supabase SQL Editor
-- Note: Les tables sont créées dans l'ordre de dépendances

-- ============================================
-- 1. TABLES SANS DÉPENDANCES
-- ============================================

-- Table employees (référencée par beaucoup d'autres tables)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['Technicien'::text, 'Bureau'::text])),
  role text NOT NULL,
  status text NOT NULL DEFAULT 'Actif'::text CHECK (status = ANY (ARRAY['Actif'::text, 'Inactif'::text, 'Maladie'::text, 'En congé'::text])),
  start_date date,
  end_date date,
  vacation_days integer DEFAULT 25,
  notes text,
  email text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- Table depots (référencée par inventory_items et employee_equipment)
CREATE TABLE IF NOT EXISTS public.depots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT depots_pkey PRIMARY KEY (id)
);

-- Table mandats (référencée par mandat_techniciens)
CREATE TABLE IF NOT EXISTS public.mandats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_mandat text NOT NULL UNIQUE,
  nom_client text NOT NULL,
  prenom_client text,
  telephone text,
  email text,
  adresse text NOT NULL,
  npa text,
  ville text,
  type_intervention text CHECK (type_intervention = ANY (ARRAY['swisscom'::text, 'ftth_fr'::text, 'sig'::text, 'rea'::text, 'smartmetering'::text])),
  statut text DEFAULT 'en_attente'::text CHECK (statut = ANY (ARRAY['en_attente'::text, 'assigne'::text, 'en_cours'::text, 'termine'::text, 'annule'::text])),
  date_creation timestamp with time zone DEFAULT now(),
  date_intervention date,
  priorite boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mandats_pkey PRIMARY KEY (id)
);

-- Table RDV (table autonome)
CREATE TABLE IF NOT EXISTS public.RDV (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_mandat text NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text NOT NULL,
  email text,
  calendrier timestamp with time zone NOT NULL DEFAULT now(),
  traite boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT RDV_pkey PRIMARY KEY (id)
);

-- Table activity_locks (table autonome)
CREATE TABLE IF NOT EXISTS public.activity_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity text NOT NULL CHECK (activity = ANY (ARRAY['swisscom'::text, 'ftth_fr'::text, 'sig'::text, 'rea'::text])),
  date date NOT NULL,
  morning_locked boolean NOT NULL DEFAULT false,
  afternoon_locked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_locks_pkey PRIMARY KEY (id)
);

-- Table vehicles (table autonome)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  license_plate text NOT NULL UNIQUE,
  mileage integer NOT NULL DEFAULT 0,
  tire_type text NOT NULL DEFAULT 'Été'::text CHECK (tire_type = ANY (ARRAY['Été'::text, 'Hiver'::text, 'Toutes saisons'::text])),
  assignment_status text NOT NULL DEFAULT 'Available'::text CHECK (assignment_status = ANY (ARRAY['Available'::text, 'Assigned'::text, 'Maintenance'::text, 'Out of Service'::text])),
  assigned_to text,
  owner text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);

-- ============================================
-- 2. TABLES DÉPENDANTES DE employees
-- ============================================

-- Table events (dépend de employees)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['work'::text, 'absent'::text, 'vacation'::text, 'sickness'::text, 'paid_leave'::text, 'public_holiday'::text])),
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table interventions (dépend de employees)
CREATE TABLE IF NOT EXISTS public.interventions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  canton text,
  activity text,
  amount_chf numeric DEFAULT 0,
  is_on_hold boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interventions_pkey PRIMARY KEY (id),
  CONSTRAINT interventions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table time_entries (dépend de employees)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  break_duration integer DEFAULT 60,
  total_hours numeric,
  filled_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT time_entries_pkey PRIMARY KEY (id),
  CONSTRAINT time_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table monthly_signatures (dépend de employees)
CREATE TABLE IF NOT EXISTS public.monthly_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  month_date date NOT NULL,
  signed_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'signed'::text,
  CONSTRAINT monthly_signatures_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_signatures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table appointments (dépend de employees)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  activity text NOT NULL,
  mandate_number text NOT NULL,
  client_name text,
  phone text,
  address text NOT NULL,
  npa text,
  city text,
  note text,
  is_urgent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by text,
  pto_reference text,
  cable_alim text,
  fibre_1 text,
  fibre_2 text,
  fibre_3 text,
  fibre_4 text,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- ============================================
-- 3. TABLES DÉPENDANTES DE depots
-- ============================================

-- Table inventory_items (dépend de depots)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  depot_id uuid NOT NULL,
  reference text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Outils'::text,
  supplier text,
  price numeric NOT NULL DEFAULT 0.0,
  quantity integer NOT NULL DEFAULT 0,
  threshold integer NOT NULL DEFAULT 0,
  photo text,
  website_url text,
  monthly_need integer NOT NULL DEFAULT 0,
  weekly_need integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_depot_id_fkey FOREIGN KEY (depot_id) REFERENCES public.depots(id)
);

-- ============================================
-- 4. TABLES AVEC DÉPENDANCES MULTIPLES
-- ============================================

-- Table employee_equipment (dépend de employees, inventory_items, depots)
CREATE TABLE IF NOT EXISTS public.employee_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  inventory_item_id uuid,
  reference text NOT NULL,
  name text NOT NULL,
  category text,
  quantity integer NOT NULL DEFAULT 1,
  scanned_at timestamp with time zone,
  scanned_by text,
  returned boolean DEFAULT false,
  returned_at timestamp with time zone,
  returned_by text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  depot_id uuid,
  CONSTRAINT employee_equipment_pkey PRIMARY KEY (id),
  CONSTRAINT employee_equipment_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT employee_equipment_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT employee_equipment_depot_id_fkey FOREIGN KEY (depot_id) REFERENCES public.depots(id)
);

-- Table mandat_techniciens (dépend de mandats et employees)
CREATE TABLE IF NOT EXISTS public.mandat_techniciens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mandat_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mandat_techniciens_pkey PRIMARY KEY (id),
  CONSTRAINT mandat_techniciens_mandat_id_fkey FOREIGN KEY (mandat_id) REFERENCES public.mandats(id),
  CONSTRAINT mandat_techniciens_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table intervention_details (dépend de appointments et employees)
CREATE TABLE IF NOT EXISTS public.intervention_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid,
  mandate_number text NOT NULL,
  pto_reference text,
  cable_alim text,
  fibre_1 text,
  fibre_2 text,
  fibre_3 text,
  fibre_4 text,
  client_note text,
  technician_id uuid,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'validated'::text, 'rejected'::text, 'blocked'::text, 'partial'::text])),
  comments text,
  materials jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activity text,
  is_urgent boolean DEFAULT false,
  client_name text,
  phone text,
  address text,
  npa text,
  city text,
  CONSTRAINT intervention_details_pkey PRIMARY KEY (id),
  CONSTRAINT intervention_details_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT intervention_details_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.employees(id)
);

-- Table intervention_photos (dépend de intervention_details et employees)
CREATE TABLE IF NOT EXISTS public.intervention_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  intervention_detail_id uuid,
  photo_type text NOT NULL,
  photo_label text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  is_additional boolean DEFAULT false,
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  score numeric,
  ai_comment text,
  is_valid boolean,
  storage_url text,
  technician_name text,
  technician_id uuid,
  capture_timestamp timestamp with time zone DEFAULT now(),
  pto_reference text,
  mandate_number text,
  fibre_colors jsonb,
  validation_status text DEFAULT 'pending'::text,
  ai_score numeric,
  ai_feedback text,
  validation_issues jsonb,
  validated_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT intervention_photos_pkey PRIMARY KEY (id),
  CONSTRAINT intervention_photos_intervention_detail_id_fkey FOREIGN KEY (intervention_detail_id) REFERENCES public.intervention_details(id),
  CONSTRAINT intervention_photos_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.employees(id)
);

-- ============================================
-- 5. TABLES AVEC DÉPENDANCES auth.users
-- ============================================

-- Table orders (dépend de auth.users)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL,
  supplier_name character varying NOT NULL,
  depot character varying NOT NULL,
  order_date date NOT NULL,
  price_ttc numeric NOT NULL,
  price_ht numeric NOT NULL,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Table user_roles (dépend de auth.users et employees)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  employee_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'chef_chantier'::text, 'dispatcher'::text, 'technicien'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Table upload_events (utilise auth.uid() dans DEFAULT)
CREATE TABLE IF NOT EXISTS public.upload_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid DEFAULT auth.uid(),
  type text NOT NULL,
  related_id uuid,
  storage_path text NOT NULL,
  bucket_id text NOT NULL DEFAULT 'private-uploads'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text,
  CONSTRAINT upload_events_pkey PRIMARY KEY (id)
);

-- ============================================
-- MESSAGES DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Toutes les tables ont été créées avec succès !';
  RAISE NOTICE '📋 Prochaines étapes :';
  RAISE NOTICE '   1. Activer RLS sur toutes les tables';
  RAISE NOTICE '   2. Créer les politiques RLS nécessaires';
  RAISE NOTICE '   3. Vérifier les index si nécessaire';
END $$;
