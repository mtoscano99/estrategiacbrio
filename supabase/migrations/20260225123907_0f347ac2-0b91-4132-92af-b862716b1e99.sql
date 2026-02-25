ALTER TABLE public.alvos_pe ADD COLUMN kpi_id uuid REFERENCES public.kpis(id);

CREATE INDEX idx_alvos_pe_kpi_id ON public.alvos_pe (kpi_id);