
-- Create junction table for multiple responsáveis per project
CREATE TABLE public.projeto_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contato_externo_id uuid REFERENCES contatos_externos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_one_responsavel CHECK (
    (profile_id IS NOT NULL AND contato_externo_id IS NULL) OR
    (profile_id IS NULL AND contato_externo_id IS NOT NULL)
  ),
  UNIQUE (projeto_id, profile_id),
  UNIQUE (projeto_id, contato_externo_id)
);

ALTER TABLE public.projeto_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read projeto_responsaveis"
ON public.projeto_responsaveis FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Coordenacao can manage projeto_responsaveis"
ON public.projeto_responsaveis FOR ALL TO authenticated
USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Lider can insert projeto_responsaveis"
ON public.projeto_responsaveis FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id));

CREATE POLICY "Lider can delete projeto_responsaveis"
ON public.projeto_responsaveis FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id));

-- Migrate existing data from projetos table
INSERT INTO public.projeto_responsaveis (projeto_id, profile_id)
SELECT id, responsavel_id FROM public.projetos WHERE responsavel_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.projeto_responsaveis (projeto_id, contato_externo_id)
SELECT id, responsavel_externo_id FROM public.projetos WHERE responsavel_externo_id IS NOT NULL
ON CONFLICT DO NOTHING;
