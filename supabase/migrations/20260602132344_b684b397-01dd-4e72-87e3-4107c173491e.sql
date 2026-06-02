
-- Drop QuoteKit tables (no longer needed)
DROP TABLE IF EXISTS public.line_items CASCADE;
DROP TABLE IF EXISTS public.proposal_events CASCADE;
DROP TABLE IF EXISTS public.proposal_versions CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TYPE IF EXISTS public.proposal_status CASCADE;
DROP TYPE IF EXISTS public.template_category CASCADE;
DROP FUNCTION IF EXISTS public.hash_share_password(text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_share_password(text, text) CASCADE;

-- PedFlow: classifications registry
CREATE TABLE public.ped_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,

  -- Document metadata
  commessa TEXT,
  cliente TEXT,
  progetto TEXT,
  numero_disegno TEXT,

  -- Fluid identification
  fluid_name TEXT NOT NULL,
  cas_no TEXT,
  ec_no TEXT,

  -- Input data
  h_codes TEXT[] NOT NULL DEFAULT '{}',
  flash_point NUMERIC,
  t_min NUMERIC,
  t_max NUMERIC,

  -- Classification result
  base_group SMALLINT NOT NULL,        -- 1 or 2
  final_group SMALLINT NOT NULL,       -- 1 or 2
  art13_applied BOOLEAN NOT NULL DEFAULT false,
  determining_h_codes TEXT[] NOT NULL DEFAULT '{}',
  rationale TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'SDS',  -- 'SDS' or 'CLP'

  -- Raw snapshot for reload/duplicate
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ped_classifications TO authenticated;
GRANT ALL ON public.ped_classifications TO service_role;

ALTER TABLE public.ped_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classifications"
  ON public.ped_classifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all org classifications"
  ON public.ped_classifications FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view org classifications"
  ON public.ped_classifications FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Users can insert own classifications"
  ON public.ped_classifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own classifications"
  ON public.ped_classifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own classifications"
  ON public.ped_classifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_ped_classifications_updated_at
  BEFORE UPDATE ON public.ped_classifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ped_classifications_user ON public.ped_classifications(user_id, created_at DESC);
CREATE INDEX idx_ped_classifications_org ON public.ped_classifications(org_id, created_at DESC);
