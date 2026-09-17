-- FARADAY ENERGY - Web Push subscriptions (panel admin)
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor > New query.
-- Es idempotente: se puede volver a correr sin romper nada.

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