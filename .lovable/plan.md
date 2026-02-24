

# Login com Google + Seleção de Perfil no Cadastro

## O que será feito

1. **Habilitar login com Google** usando o sistema gerenciado do Lovable Cloud (sem necessidade de configurar credenciais).

2. **Adicionar seleção de perfil no cadastro** -- ao criar conta (email/senha), o usuário escolhe se é "Coordenador(a)" ou "Líder de Área".

3. **Criar página de seleção de perfil para novos usuários Google** -- quando um usuário faz login com Google pela primeira vez e ainda não tem role definida, será redirecionado para uma tela onde escolhe seu perfil antes de acessar o sistema.

4. **Criar edge function para atribuir role** -- para inserir na tabela `user_roles` de forma segura (já que o usuário recém-criado não tem permissão de INSERT nessa tabela via RLS).

## Detalhes Técnicos

### 1. Configurar Social Login (Google)
- Usar a ferramenta `configure-social-auth` para gerar o módulo `src/integrations/lovable`
- Usar `lovable.auth.signInWithOAuth("google", ...)` no botão de login

### 2. Alterar `src/pages/Login.tsx`
- Adicionar botão "Entrar com Google"
- No formulário de cadastro (sign up), adicionar radio group para selecionar perfil: "Coordenação" ou "Líder de Área"
- Salvar a role escolhida nos metadados do usuário (`raw_user_meta_data.role`) durante o signup

### 3. Criar `src/pages/SelecionarPerfil.tsx`
- Tela simples com radio group para escolher perfil
- Aparece apenas para usuários autenticados que ainda não têm role na tabela `user_roles`
- Chama a edge function para salvar a role

### 4. Criar edge function `assign-role`
- Recebe `{ role: "coordenacao" | "lider_area" }` 
- Verifica se o usuário autenticado ainda não tem role
- Insere na tabela `user_roles` usando service role key

### 5. Atualizar trigger `handle_new_user`
- Migração SQL: se o `raw_user_meta_data` contiver `role`, inserir automaticamente na `user_roles` ao criar o perfil (para cadastros via email/senha)

### 6. Atualizar `src/App.tsx` e `AuthContext`
- Adicionar rota `/selecionar-perfil`
- No `ProtectedRoute`, redirecionar para `/selecionar-perfil` se o usuário não tiver role definida
- Adicionar `needsRole` no contexto de auth

### 7. Atualizar rotas
- `/selecionar-perfil` -- rota protegida (precisa estar logado, mas sem role)
- Redirecionar automaticamente após seleção para `/dashboard`

