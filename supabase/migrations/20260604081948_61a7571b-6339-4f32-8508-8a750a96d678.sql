ALTER TABLE public.clp_substances_db
  ADD COLUMN IF NOT EXISTS pictograms TEXT,
  ADD COLUMN IF NOT EXISTS labelling_h_codes TEXT;