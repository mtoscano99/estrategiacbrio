# Plano: Criar `CONTEXT.md` técnico do sistema

Criar um arquivo `CONTEXT.md` na raiz do projeto contendo a documentação técnica completa do Sistema de Gestão Estratégica CBRio, organizada em tópicos.

## Estrutura proposta do documento

### 1. Visão Geral
- Nome: CBRio – Sistema de Gestão Estratégica
- Propósito: gestão de planejamento estratégico, KPIs, projetos, aprovações, ATAs e relatórios
- URLs: preview + publicado (`estrategiacbrio.lovable.app`)

### 2. Stack Tecnológica (Frontend)
- React 18 + TypeScript 5 + Vite 5
- Tailwind CSS v3 + shadcn/ui (Radix UI)
- React Router v6 (rotas protegidas por sessão e role)
- TanStack Query (cache e fetch)
- Sonner + Toaster (notificações)
- lucide-react (ícones)
- Design system via tokens semânticos em `src/index.css` + `tailwind.config.ts`

### 3. Backend (Lovable Cloud / Supabase)
- PostgreSQL gerenciado
- Auth: email/senha + Google OAuth (via `@lovable.dev/cloud-auth-js`)
- Storage buckets: `avatars`, `project-attachments`
- Edge Functions (Deno):
  - `assign-role` — atribuição de perfil
  - `ai-project-assistant` — assistente IA de projetos
  - `import-project-doc` — importação de documento único
  - `import-projects-bulk` — importação em massa
  - `process-ata` — processamento de ATAs

### 4. Modelo de Autenticação e Autorização
- Tabela `profiles` (dados pessoais + `area_id`)
- Tabela `user_roles` separada com enum `app_role` (`coordenacao`, `lider_area`)
- Funções SECURITY DEFINER: `has_role`, `get_user_area_id`, `user_in_project_area`
- Trigger `handle_new_user` cria profile + role no signup
- Fluxo: Login → AuthContext busca profile+role → se sem role → `/selecionar-perfil` → senão → `/dashboard`

### 5. Modelo de Dados (principais tabelas)
- `areas` — áreas estratégicas
- `projetos` — projetos com `area_id`, status, valores
- `projeto_responsaveis` — junção N:N projeto ↔ profile (múltiplos responsáveis)
- `etapas_projeto` — etapas com valores gastos (trigger `sync_projeto_valor_gasto`)
- `kpis` + `medicoes_kpi` — indicadores e medições
- `contatos_externos` — stakeholders externos
- `anexos_projeto` — vínculo com storage
- `aprovacoes` — fluxo de aprovação
- `notificacoes` — alertas in-app
- RLS habilitado em todas; políticas usam `has_role` + área do usuário

### 6. IA e Integrações
- Lovable AI Gateway (Gemini-3-Flash) via `LOVABLE_API_KEY`
- Usos: assistente de projetos, importação de docs, parsing de ATAs

### 7. Estrutura de Pastas
```
src/
  pages/            # rotas (Dashboard, Projetos, KPIs, Aprovações, etc.)
  components/
    layout/         # AppLayout, AppSidebar
    projetos/       # SWOT, ResponsavelCombobox, Anexos, Contatos
    kpis/           # KPICard, dialogs
    calendario/
  contexts/         # AuthContext
  integrations/
    supabase/       # client + types (auto-gen)
    lovable/        # OAuth helper
  hooks/ lib/ test/
supabase/
  functions/        # edge functions
  migrations/       # SQL versionado
```

### 8. Rotas Principais
- Públicas: `/login`, `/selecionar-perfil`
- Protegidas (AppLayout): `/dashboard`, `/kpis`, `/projetos`, `/novo-projeto`, `/importar-projetos`, `/importar-ata`, `/calendario`, `/aprovacoes`, `/planejamento`, `/relatorios`, `/relatorios/financeiro`, `/perfil`

### 9. Build, Dev e Deploy
- Dev: Vite (`npm run dev`, porta 8080)
- Testes: Vitest
- Deploy: Lovable (auto-publish)
- Variáveis Vite: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

### 10. Convenções e Boas Práticas
- Tokens semânticos (sem cores hardcoded)
- RLS + GRANT obrigatórios em toda tabela `public`
- Roles **nunca** em `profiles` — sempre em `user_roles`
- Cliente Supabase auto-gerado (`src/integrations/supabase/client.ts` não editar)

## Arquivo criado
- `CONTEXT.md` (raiz do projeto) — ~200-300 linhas, markdown puro, sem emojis, com tabelas e blocos de código onde fizer sentido.

## Confirmação
Posso seguir e criar `CONTEXT.md` com essa estrutura?
