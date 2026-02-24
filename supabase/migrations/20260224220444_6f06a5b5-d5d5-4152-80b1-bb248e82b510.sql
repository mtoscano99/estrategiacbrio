
-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text,
  link text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultas por usuário
CREATE INDEX idx_notificacoes_usuario_id ON public.notificacoes (usuario_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas suas próprias
CREATE POLICY "Users can read own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

-- INSERT: qualquer autenticado pode inserir (para criar notificações em nome de ações de outros)
CREATE POLICY "Authenticated can insert notificacoes"
ON public.notificacoes FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: usuário pode atualizar apenas as próprias (marcar como lida)
CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid());

-- DELETE: usuário pode excluir apenas as próprias
CREATE POLICY "Users can delete own notificacoes"
ON public.notificacoes FOR DELETE
TO authenticated
USING (usuario_id = auth.uid());

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
