
-- Tabela para itens da Matriz SWOT vinculados a projetos
CREATE TABLE public.swot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('forca', 'fraqueza', 'oportunidade', 'ameaca')),
  descricao text NOT NULL,
  criado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_swot_items_projeto_id ON public.swot_items(projeto_id);

-- Habilitar RLS
ALTER TABLE public.swot_items ENABLE ROW LEVEL SECURITY;

-- Leitura: coordenação ou membros da mesma área do projeto
CREATE POLICY "Users can read swot items"
  ON public.swot_items FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao') 
    OR public.user_in_project_area(auth.uid(), projeto_id)
  );

-- Coordenação pode tudo
CREATE POLICY "Coordenacao can manage swot items"
  ON public.swot_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'))
  WITH CHECK (public.has_role(auth.uid(), 'coordenacao'));

-- Líderes podem inserir na sua área
CREATE POLICY "Lider can insert swot items"
  ON public.swot_items FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'lider_area') 
    AND public.user_in_project_area(auth.uid(), projeto_id)
    AND criado_por = auth.uid()
  );

-- Líderes podem deletar itens da sua área
CREATE POLICY "Lider can delete swot items"
  ON public.swot_items FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'lider_area') 
    AND public.user_in_project_area(auth.uid(), projeto_id)
  );
