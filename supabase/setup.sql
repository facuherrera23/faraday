-- =====================================================================
-- FARADAY ENERGY - Supabase Setup (ejecutar UNA VEZ en SQL Editor)
-- Proyecto nuevo gratuito creado en https://supabase.com
-- Costo: $0 (Supabase Free Tier: 500MB DB, 50K auth users, ilimitado API)
-- =====================================================================

-- ===== 1. TABLA DE ENVÍOS DEL FORMULARIO (leads) =====

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  nombre       text NOT NULL,
  empresa      text,
  email        text NOT NULL,
  telefono     text,
  tipo_servicio text NOT NULL DEFAULT 'OTRA CONSULTA',
  mensaje      text NOT NULL,
  estado       text NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo','leido','contactado','cerrado'))
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Cualquiera (visitante anonimo) puede INSERTAR, pero solo con datos plausibles
-- (longitudes minimas/maximas); nadie lee sin ser staff.
DROP POLICY IF EXISTS cs_insert_public ON public.contact_submissions;
CREATE POLICY cs_insert_public
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(nombre)) BETWEEN 2 AND 80
    AND char_length(trim(mensaje)) BETWEEN 10 AND 2000
    AND char_length(email) BETWEEN 5 AND 120
    AND (telefono IS NULL OR char_length(telefono) <= 20)
  );

-- Cambio de rol solo via funcion SECURITY DEFINER (el cliente nunca escribe
-- la columna role directamente). Verifica que el caller sea super_admin.
CREATE OR REPLACE FUNCTION public.update_user_role(target_user uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF new_role NOT IN ('admin', 'super_admin', 'pending') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;
  UPDATE public.admin_profiles SET role = new_role WHERE user_id = target_user;
END;
$$;

-- SELECT/UPDATE/DELETE solo para staff (rol admin o super_admin).
DROP POLICY IF EXISTS cs_staff_select ON public.contact_submissions;
CREATE POLICY cs_staff_select
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('admin','super_admin'));

DROP POLICY IF EXISTS cs_staff_update ON public.contact_submissions;
CREATE POLICY cs_staff_update
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('admin','super_admin'))
  WITH CHECK (public.current_user_role() IN ('admin','super_admin'));

DROP POLICY IF EXISTS cs_super_delete ON public.contact_submissions;
CREATE POLICY cs_super_delete
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'super_admin');


-- ===== 2. PERFILES DE USUARIOS DEL PANEL (roles) =====

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  nombre     text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'pending' CHECK (role IN ('pending','admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;


-- ===== 3. FUNCIÓN AUXILIAR (lee el rol sin recursión RLS) =====

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.admin_profiles WHERE user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;


-- ===== 4. RLS DE admin_profiles =====

-- Cualquier usuario autenticado puede leer su propio perfil (para saber si está pendiente).
DROP POLICY IF EXISTS ap_self_select ON public.admin_profiles;
CREATE POLICY ap_self_select
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Los super_admin leen TODOS los perfiles (para gestionar el equipo).
DROP POLICY IF EXISTS ap_super_select ON public.admin_profiles;
CREATE POLICY ap_super_select
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'super_admin');

-- Super_admin cambia roles / nombre (aprobar a 'admin' desde 'pending', etc).
DROP POLICY IF EXISTS ap_super_update ON public.admin_profiles;
CREATE POLICY ap_super_update
  ON public.admin_profiles
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'super_admin' AND user_id <> auth.uid())
  WITH CHECK (public.current_user_role() = 'super_admin' AND user_id <> auth.uid());
-- user_id <> auth.uid() impide que un super admin se deje a si mismo sin permisos por accidente


-- ===== 5. TRIGGER: crear fila de perfil cuando alguien se registra =====

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, email, nombre, role)
  VALUES (NEW.id, NEW.email, '', 'pending');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===== 6. DESPUÉS DE REGISTRARTE POR PRIMERA VEZ, EJECUTÁ ESTO =====
-- (sustituí TU_EMAIL por el mail con el que te registraste):
--
-- UPDATE public.admin_profiles
-- SET role = 'super_admin', nombre = 'Administrador'
-- WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
--
-- Ese es el CHIEF ADMIN. Desde ahi, todos los demás usuarios se aprueban
-- desde el propio panel admin (pestaña EQUIPO), sin SQL.

-- ===== 7. TESTIMONIOS DE CLIENTES (publicados en clientes.html) =====

CREATE TABLE IF NOT EXISTS public.testimonios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  nombre      text NOT NULL,
  empresa     text,
  texto       text NOT NULL,
  aprobado    boolean NOT NULL DEFAULT false
);

ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS t_select_public ON public.testimonios;
CREATE POLICY t_select_public
  ON public.testimonios
  FOR SELECT
  TO anon, authenticated
  USING (aprobado = true);

DROP POLICY IF EXISTS t_staff_all ON public.testimonios;
CREATE POLICY t_staff_all
  ON public.testimonios
  FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin','super_admin'))
  WITH CHECK (public.current_user_role() IN ('admin','super_admin'));

-- =====================================================================
-- LISTO. El siguiente paso es copiar de Settings > API:
--   - Project URL   → window.SUPABASE_URL en js/supabase-config.js
--   - anon/public key → window.SUPABASE_ANON_KEY en js/supabase-config.js
-- =====================================================================

-- ===== 8. WEB PUSH (notificaciones del panel admin) =====
-- (Tambien disponible como supabase/push-subscriptions.sql)

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona SOLO sus propias suscripciones.
DROP POLICY IF EXISTS ps_self_all ON public.push_subscriptions;
CREATE POLICY ps_self_all
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Las Edge Functions leen todas las suscripciones con service_role
-- (bypasea RLS); no hacen falta mas politicas.
