

# Perfil de Usuario com Foto, Cargo, Nascimento e Contato

## Resumo

Criar uma pagina de perfil do usuario e estender a tabela `profiles` com novos campos (foto, cargo, data de nascimento, telefone, email de contato). Fotos de perfil serao exibidas como avatares ao lado do nome em todos os dropdowns do sistema.

## O que muda para o usuario

1. **Nova pagina "Meu Perfil"** acessivel pela sidebar (clicando no nome/avatar na parte inferior)
2. Na pagina de perfil pode:
   - Fazer upload e trocar foto de perfil
   - Editar cargo, data de nascimento, telefone e email de contato
3. **Avatares com foto** aparecem em todos os selects/dropdowns de responsavel (NovoProjeto, ProjetoDetalhe etapas) e na sidebar
4. Storage bucket `avatars` criado para armazenar as fotos

## Detalhes Tecnicos

### 1. Migracao no banco de dados

Adicionar colunas na tabela `profiles`:

```sql
ALTER TABLE public.profiles ADD COLUMN avatar_url text;
ALTER TABLE public.profiles ADD COLUMN cargo text;
ALTER TABLE public.profiles ADD COLUMN data_nascimento date;
ALTER TABLE public.profiles ADD COLUMN telefone text;
ALTER TABLE public.profiles ADD COLUMN email_contato text;
```

### 2. Storage bucket para avatares

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Nova pagina `src/pages/MeuPerfil.tsx`

- Exibe foto atual (ou iniciais como fallback) com botao de upload
- Upload envia para `avatars/{user_id}/avatar.png` e atualiza `profiles.avatar_url`
- Formulario com campos: nome, cargo, data de nascimento, telefone, email de contato
- Salva via update na tabela `profiles`

### 4. Atualizar `src/contexts/AuthContext.tsx`

- Expandir interface `Profile` com `avatar_url`, `cargo`, `data_nascimento`, `telefone`, `email_contato`
- Atualizar o select em `fetchProfile` para incluir os novos campos
- Adicionar funcao `refreshProfile` no contexto para recarregar apos edicao

### 5. Atualizar `src/components/layout/AppSidebar.tsx`

- Exibir avatar do usuario (usando componente Avatar) ao lado do nome na parte inferior
- Avatar clicavel leva para `/perfil`

### 6. Atualizar `src/App.tsx`

- Adicionar rota `/perfil` com componente `MeuPerfil`

### 7. Componente auxiliar `src/components/UserAvatar.tsx`

Componente reutilizavel que recebe `avatarUrl` e `nome`, exibe a foto ou as iniciais como fallback. Sera usado nos dropdowns e na sidebar.

### 8. Atualizar dropdowns de responsavel

Nos seguintes arquivos, atualizar o select de profiles para incluir `avatar_url` na query e exibir `UserAvatar` ao lado do nome nos `SelectItem`:

- `src/pages/NovoProjeto.tsx` - dropdown de responsavel
- `src/pages/ProjetoDetalhe.tsx` - dropdowns de responsavel nas etapas (criacao e edicao)

A query de profiles passa de `select("id, nome")` para `select("id, nome, avatar_url")`.

### 9. RLS existente dos profiles

A politica "Users can update own profile" ja cobre os novos campos. Nao e necessario criar novas politicas, pois as existentes aplicam-se a todas as colunas.

