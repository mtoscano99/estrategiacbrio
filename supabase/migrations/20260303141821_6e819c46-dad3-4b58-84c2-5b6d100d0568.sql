
-- Create contatos_externos table
CREATE TABLE public.contatos_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  cargo text,
  organizacao text,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read contatos" ON public.contatos_externos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contatos" ON public.contatos_externos FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "Coordenacao can manage contatos" ON public.contatos_externos FOR ALL TO authenticated USING (has_role(auth.uid(), 'coordenacao'));

-- Add responsavel_externo_id to projetos and etapas_projeto
ALTER TABLE public.projetos ADD COLUMN responsavel_externo_id uuid REFERENCES public.contatos_externos(id);
ALTER TABLE public.etapas_projeto ADD COLUMN responsavel_externo_id uuid REFERENCES public.contatos_externos(id);
