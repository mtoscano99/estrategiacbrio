
-- Criar bucket para anexos de projetos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-attachments', 'project-attachments', true);

-- Políticas de storage
CREATE POLICY "Authenticated can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-attachments');

CREATE POLICY "Coordenacao or uploader can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-attachments'
  AND (
    public.has_role(auth.uid(), 'coordenacao'::app_role)
    OR (storage.foldername(name))[1] IS NOT NULL
  )
);

-- Tabela de metadados de anexos
CREATE TABLE public.anexos_projeto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  tamanho bigint,
  tipo_mime text,
  storage_path text NOT NULL,
  enviado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anexos_projeto ENABLE ROW LEVEL SECURITY;

-- SELECT: coordenacao vê tudo, líderes veem da sua área
CREATE POLICY "Coordenacao can read all anexos"
ON public.anexos_projeto FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Lider can read own area anexos"
ON public.anexos_projeto FOR SELECT
TO authenticated
USING (public.user_in_project_area(auth.uid(), projeto_id));

-- INSERT: autenticados podem inserir com enviado_por = auth.uid()
CREATE POLICY "Authenticated can insert anexos"
ON public.anexos_projeto FOR INSERT
TO authenticated
WITH CHECK (enviado_por = auth.uid());

-- DELETE: coordenacao pode excluir qualquer; usuario pode excluir os próprios
CREATE POLICY "Coordenacao can delete any anexo"
ON public.anexos_projeto FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "User can delete own anexos"
ON public.anexos_projeto FOR DELETE
TO authenticated
USING (enviado_por = auth.uid());
