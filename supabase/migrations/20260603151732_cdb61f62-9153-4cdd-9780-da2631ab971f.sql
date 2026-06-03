
CREATE TABLE public.clp_substances_db (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_no text,
  chemical_name text NOT NULL,
  ec_no text,
  cas_no text,
  hazard_codes text,
  gruppo_ped text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clp_substances_name_idx ON public.clp_substances_db USING gin (to_tsvector('simple', chemical_name));
CREATE INDEX clp_substances_cas_idx ON public.clp_substances_db (cas_no);
CREATE INDEX clp_substances_ec_idx ON public.clp_substances_db (ec_no);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clp_substances_db TO authenticated;
GRANT ALL ON public.clp_substances_db TO service_role;

ALTER TABLE public.clp_substances_db ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view clp_substances_db" ON public.clp_substances_db
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Manager can insert clp_substances_db" ON public.clp_substances_db
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin/Manager can update clp_substances_db" ON public.clp_substances_db
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin/Manager can delete clp_substances_db" ON public.clp_substances_db
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));

CREATE TRIGGER update_clp_substances_updated_at
  BEFORE UPDATE ON public.clp_substances_db
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
