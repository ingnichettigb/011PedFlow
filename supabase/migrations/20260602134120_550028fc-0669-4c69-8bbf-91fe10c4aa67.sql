CREATE TABLE public.h_codes_db (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codice TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  gruppo_ped TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.h_codes_db TO authenticated;
GRANT ALL ON public.h_codes_db TO service_role;

ALTER TABLE public.h_codes_db ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view h_codes_db"
  ON public.h_codes_db FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin/Manager can insert h_codes_db"
  ON public.h_codes_db FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin/Manager can update h_codes_db"
  ON public.h_codes_db FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin/Manager can delete h_codes_db"
  ON public.h_codes_db FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_h_codes_db_updated_at
  BEFORE UPDATE ON public.h_codes_db
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.h_codes_db (codice, categoria, descrizione, gruppo_ped) VALUES
('H200','Esplosivi/Reattivi','Esplosivo instabile','Gruppo 1'),
('H201','Esplosivi/Reattivi','Esplosivo; pericolo di esplosione di massa','Gruppo 1'),
('H202','Esplosivi/Reattivi','Esplosivo; grave pericolo di proiezione','Gruppo 1'),
('H203','Esplosivi/Reattivi','Esplosivo; pericolo di incendio, spostamento d''aria o proiezione','Gruppo 1'),
('H204','Esplosivi/Reattivi','Pericolo di incendio o proiezione','Gruppo 1'),
('H205','Esplosivi/Reattivi','Pericolo di esplosione di massa in caso di incendio','Gruppo 1'),
('H206','Esplosivi/Reattivi','Pericolo di incendio, spostamento d''aria o proiezione (esplosivi desensibilizzati)','DA APPROFONDIRE'),
('H207','Esplosivi/Reattivi','Pericolo di incendio o proiezione (esplosivi desensibilizzati)','DA APPROFONDIRE'),
('H208','Esplosivi/Reattivi','Pericolo di incendio (esplosivi desensibilizzati)','DA APPROFONDIRE'),
('H220','Infiammabili','Gas estremamente infiammabile','Gruppo 1'),
('H221','Infiammabili','Gas infiammabile','Gruppo 1'),
('H222','Infiammabili','Aerosol estremamente infiammabile','DA APPROFONDIRE'),
('H223','Infiammabili','Aerosol infiammabile','DA APPROFONDIRE'),
('H224','Infiammabili','Liquido e vapori estremamente infiammabili','Gruppo 1'),
('H225','Infiammabili','Liquido e vapori facilmente infiammabili','Gruppo 1'),
('H226','Infiammabili','Liquido e vapori infiammabili','Gruppo 1 /Flash Point'),
('H228','Infiammabili','Solido infiammabile','Gruppo 1'),
('H229','Infiammabili','Contenitore pressurizzato; può esplodere se riscaldato','DA APPROFONDIRE'),
('H230','Infiammabili','Può esplodere anche in assenza di aria','Gruppo 1'),
('H231','Infiammabili','Può esplodere anche in assenza di aria a pressione e/o temperatura elevata','Gruppo 1'),
('H240','Esplosivi/Reattivi','Rischio di esplosione per riscaldamento','Gruppo 1'),
('H241','Esplosivi/Reattivi','Rischio di incendio o esplosione per riscaldamento','Gruppo 1'),
('H242','Esplosivi/Reattivi','Rischio di incendio per riscaldamento','Gruppo 1'),
('H250','Infiammabili','Può infiammarsi spontaneamente a contatto con l''aria','Gruppo 1'),
('H251','Infiammabili','Autoriscaldante in grandi quantità; può infiammarsi','Gruppo 1'),
('H252','Infiammabili','Autoriscaldante in grandi quantità; può infiammarsi','Gruppo 1'),
('H260','Infiammabili','A contatto con acqua libera gas infiammabili che possono infiammarsi spontaneamente','Gruppo 1'),
('H261','Infiammabili','A contatto con acqua libera gas infiammabili','Gruppo 1'),
('H270','Comburenti','Può provocare o aggravare un incendio; comburente','Gruppo 1'),
('H271','Comburenti','Può provocare un incendio o un''esplosione; molto comburente','Gruppo 1'),
('H272','Comburenti','Può aggravare un incendio; comburente','Gruppo 1'),
('H300','Tossicità acuta','Letale se ingerito','Gruppo 1'),
('H301','Tossicità acuta','Tossico se ingerito','Gruppo 1'),
('H302','Tossicità acuta','Nocivo se ingerito (cat. 4 – soglia non sufficiente per Gruppo 1)','Gruppo 2'),
('H310','Tossicità acuta','Letale a contatto con la pelle','Gruppo 1'),
('H311','Tossicità acuta','Tossico a contatto con la pelle','Gruppo 1'),
('H312','Tossicità acuta','Nocivo a contatto con la pelle (cat. 4 – soglia non sufficiente per Gruppo 1)','Gruppo 2'),
('H314','Corrosivo','Provoca gravi ustioni cutanee e gravi lesioni oculari','DA APPROFONDIRE'),
('H330','Tossicità acuta','Letale se inalato','Gruppo 1'),
('H331','Tossicità acuta','Tossico se inalato','Gruppo 1'),
('H332','Tossicità acuta','Nocivo se inalato (cat. 4 – soglia non sufficiente per Gruppo 1)','Gruppo 2'),
('H340','Mutageno','Può provocare alterazioni genetiche','DA APPROFONDIRE'),
('H350','Cancerogeno','Può provocare il cancro','DA APPROFONDIRE'),
('H360','Tox. riproduzione','Può nuocere alla fertilità o al feto','DA APPROFONDIRE'),
('H370','Org. bersaglio','Provoca danni agli organi (esposizione singola, cat. 1)','Gruppo 1'),
('H371','Org. bersaglio','Può provocare danni agli organi (esposizione singola, cat. 2)','DA APPROFONDIRE'),
('H372','Org. bersaglio','Provoca danni agli organi in caso di esposizione prolungata (tossicità cronica, cat. 1)','DA APPROFONDIRE')
ON CONFLICT (codice) DO NOTHING;