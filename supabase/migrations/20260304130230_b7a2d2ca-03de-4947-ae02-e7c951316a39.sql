
-- 1. Create categorias_projeto table
CREATE TABLE public.categorias_projeto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text DEFAULT '#6366f1',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_projeto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read categorias" ON public.categorias_projeto
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coordenacao can manage categorias" ON public.categorias_projeto
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- 2. Add categoria_id to projetos
ALTER TABLE public.projetos ADD COLUMN categoria_id uuid REFERENCES public.categorias_projeto(id) ON DELETE SET NULL;

-- 3. Add projeto_id to kpis
ALTER TABLE public.kpis ADD COLUMN projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL;
