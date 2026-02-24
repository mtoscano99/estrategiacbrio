
-- Tabela de KPIs
CREATE TABLE public.kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT '%',
  meta NUMERIC NOT NULL DEFAULT 0,
  area_id UUID REFERENCES public.areas_estrategicas(id) ON DELETE SET NULL,
  objetivo_id UUID REFERENCES public.objetivos_estrategicos(id) ON DELETE SET NULL,
  periodicidade TEXT NOT NULL DEFAULT 'mensal',
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de medições
CREATE TABLE public.kpi_medicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_referencia DATE NOT NULL,
  observacao TEXT,
  registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger updated_at para kpis
CREATE TRIGGER update_kpis_updated_at
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS kpis
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read kpis"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordenacao can manage kpis"
  ON public.kpis FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));

-- RLS kpi_medicoes
ALTER TABLE public.kpi_medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read medicoes"
  ON public.kpi_medicoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordenacao can manage medicoes"
  ON public.kpi_medicoes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Lider can insert medicoes da sua area"
  ON public.kpi_medicoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'lider_area')
    AND registrado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.kpis k
      WHERE k.id = kpi_id
        AND k.area_id = public.get_user_area_id(auth.uid())
    )
  );

-- Indexes
CREATE INDEX idx_kpis_area ON public.kpis(area_id);
CREATE INDEX idx_kpis_objetivo ON public.kpis(objetivo_id);
CREATE INDEX idx_kpi_medicoes_kpi ON public.kpi_medicoes(kpi_id);
CREATE INDEX idx_kpi_medicoes_data ON public.kpi_medicoes(data_referencia);
