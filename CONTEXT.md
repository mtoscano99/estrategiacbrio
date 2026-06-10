# CBRio — Sistema de Gestão Estratégica

Documento técnico de contexto do sistema. Serve como referência rápida para desenvolvedores, agentes de IA e novos integrantes do time.

---

## 1. Visão Geral

- **Nome**: CBRio — Sistema de Gestão Estratégica
- **Propósito**: plataforma interna para gestão de planejamento estratégico, KPIs, projetos, etapas, aprovações, ATAs de reunião e relatórios financeiros/executivos.
- **Tipo de aplicação**: SPA (Single Page Application) client-side, com backend serverless via Lovable Cloud.
- **URLs**:
  - Preview (dev): `id-preview--b26cde2b-26d9-442b-b190-ff8dc407c605.lovable.app`
  - Produção: `estrategiacbrio.lovable.app`

---

## 2. Stack Tecnológica — Frontend

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript 5 |
| Framework UI | React 18 |
| Build / Dev server | Vite 5 (porta 8080) |
| Estilização | Tailwind CSS v3 |
| Componentes | shadcn/ui (Radix UI primitives) |
| Roteamento | React Router v6 |
| Data fetching / cache | TanStack Query v5 |
| Notificações | Sonner + Toaster (shadcn) |
| Ícones | lucide-react |
| Forms | react-hook-form + zod |
| Testes | Vitest |
| Geração de documentos | `docx` (DOCX generator client-side) |

### Design System

- Todos os tokens de cor, gradiente e sombra são **semânticos**, definidos em `src/index.css` e mapeados em `tailwind.config.ts`.
- Componentes shadcn consomem variantes via CVA (`class-variance-authority`).
- **Não usar** cores hardcoded (`text-white`, `bg-[#xxx]`) em componentes — quebra dark mode e theming.

---

## 3. Stack Tecnológica — Backend (Lovable Cloud)

Backend totalmente gerenciado pela **Lovable Cloud** (infra Supabase open-source por baixo).

| Serviço | Uso |
|---|---|
| PostgreSQL | Banco principal, com RLS habilitado |
| Auth | Email/senha + Google OAuth |
| Storage | Buckets `avatars` e `project-attachments` (públicos) |
| Edge Functions | Runtime Deno, deploy automático |
| Secrets | `LOVABLE_API_KEY`, `SUPABASE_*` (gerenciados pela plataforma) |

### Edge Functions

| Função | `verify_jwt` | Responsabilidade |
|---|---|---|
| `assign-role` | false | Atribuição inicial de perfil ao usuário |
| `ai-project-assistant` | false | Assistente IA contextual de projetos |
| `import-project-doc` | false | Importação de um único documento de projeto |
| `import-projects-bulk` | false | Importação em massa de projetos |
| `process-ata` | false | Parsing/extração estruturada de ATAs de reunião |

---

## 4. Autenticação e Autorização

### Fluxo
1. Usuário acessa `/login` → entra com email/senha ou Google OAuth (helper `@lovable.dev/cloud-auth-js`).
2. `AuthContext` (`src/contexts/AuthContext.tsx`) escuta `supabase.auth.onAuthStateChange` e, ao detectar sessão, carrega `profile` + `role` em paralelo.
3. Se o usuário **não tem role** → redirect para `/selecionar-perfil`.
4. Caso contrário → libera rotas protegidas dentro do `AppLayout`.

### Modelo de roles
- **NUNCA** armazenar role na tabela `profiles`.
- Tabela dedicada `user_roles` com enum `app_role` (`coordenacao` | `lider_area`).
- Toda checagem de permissão é feita por funções `SECURITY DEFINER`:
  - `has_role(_user_id, _role)` — verificação genérica
  - `get_user_area_id(_user_id)` — retorna área do usuário
  - `user_in_project_area(_user_id, _projeto_id)` — escopo por área
- Trigger `handle_new_user` cria automaticamente `profiles` + `user_roles` quando há `raw_user_meta_data.role` no signup (email/senha). Logins Google entram sem role e caem no `/selecionar-perfil`.

---

## 5. Modelo de Dados

Tabelas principais no schema `public` (todas com RLS habilitado e GRANTs explícitos):

| Tabela | Descrição |
|---|---|
| `areas` | Áreas estratégicas da organização |
| `profiles` | Dados pessoais do usuário + `area_id` (FK `auth.users`) |
| `user_roles` | Roles por usuário (separada por segurança) |
| `projetos` | Projetos estratégicos com `area_id`, status, datas e valores |
| `projeto_responsaveis` | Junção N:N entre projetos e responsáveis (múltiplos por projeto) |
| `etapas_projeto` | Etapas/marcos com `valor_gasto`; trigger `sync_projeto_valor_gasto` agrega no projeto |
| `kpis` | Indicadores-chave por área/projeto |
| `medicoes_kpi` | Histórico de medições de KPI |
| `contatos_externos` | Stakeholders externos vinculados a projetos |
| `anexos_projeto` | Metadados de arquivos no bucket `project-attachments` |
| `aprovacoes` | Fluxo de aprovação (solicitante, aprovador, status) |
| `notificacoes` | Alertas in-app por usuário |

### Triggers de domínio
- `sync_projeto_valor_gasto` — recalcula `projetos.valor_gasto` a partir das etapas
- `update_updated_at_column` — mantém `updated_at` em tabelas auditadas
- `handle_new_user` — provisiona profile + role no signup

### Políticas RLS
- `coordenacao` → acesso amplo
- `lider_area` → escopo restrito à própria área via `user_in_project_area` / `get_user_area_id`

---

## 6. Integrações de IA

- **Lovable AI Gateway** com modelo **Gemini-3-Flash** (Google) via `LOVABLE_API_KEY`.
- Não requer chave do usuário final.
- Usos atuais:
  - Assistente conversacional sobre projetos (`ai-project-assistant`)
  - Extração estruturada de ATAs (`process-ata`)
  - Parsing de documentos para criação assistida de projetos (`import-project-doc`, `import-projects-bulk`)

---

## 7. Estrutura de Pastas

```
src/
  pages/                       # uma rota por arquivo
    Dashboard.tsx
    Projetos.tsx / ProjetoDetalhe.tsx / NovoProjeto.tsx
    KPIs.tsx / KPIDetalhe.tsx
    Aprovacoes.tsx
    PlanejamentoEstrategico.tsx
    Relatorios.tsx / RelatorioFinanceiro.tsx
    Calendario.tsx
    ImportarProjetosMassa.tsx / ImportarATA.tsx
    MeuPerfil.tsx / SelecionarPerfil.tsx / Login.tsx
  components/
    layout/                    # AppLayout, AppSidebar
    projetos/                  # SWOTMatrix, ResponsavelCombobox, Anexos, Contatos
    kpis/                      # KPICard, NovoKPIDialog, NovaMedicaoDialog
    calendario/                # NovaEtapaCalendarioDialog
    ui/                        # shadcn (gerado)
  contexts/
    AuthContext.tsx            # sessão, profile, role, helpers
  integrations/
    supabase/
      client.ts                # auto-gerado — NÃO editar
      types.ts                 # tipos do schema — auto-gerado
    lovable/
      index.ts                 # wrapper OAuth Google
  hooks/                       # use-mobile, use-toast
  lib/                         # utils, docxGenerator
  test/                        # vitest setup + exemplos
supabase/
  config.toml                  # config de edge functions
  functions/                   # código Deno
  migrations/                  # SQL versionado (timestamp_uuid.sql)
```

---

## 8. Rotas

### Públicas
- `/login` — login email/senha + Google
- `/selecionar-perfil` — usuário autenticado sem role escolhe perfil

### Protegidas (dentro de `AppLayout`)
- `/dashboard`
- `/kpis`, `/kpis/:id`
- `/projetos`, `/projetos/:id`, `/novo-projeto`
- `/importar-projetos`, `/importar-ata`
- `/calendario`
- `/aprovacoes`
- `/planejamento`
- `/relatorios`, `/relatorios/financeiro`
- `/perfil`

Guards: `PublicRoute`, `ProtectedRoute`, `RoleRoute` em `src/App.tsx`.

---

## 9. Build, Dev e Deploy

| Comando | Descrição |
|---|---|
| `npm run dev` | Vite dev server (HMR, porta 8080) |
| `npm run build` | Build de produção |
| `npm run preview` | Servir build localmente |
| `bunx vitest run` | Testes |

### Variáveis de ambiente (Vite)
Definidas automaticamente pelo Lovable Cloud em `.env` (não editar manualmente):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Deploy
- Publicação automática pelo Lovable em `estrategiacbrio.lovable.app`.
- Migrations SQL são aplicadas automaticamente ao serem criadas em `supabase/migrations/`.
- Edge Functions: deploy automático ao salvar.

---

## 10. Convenções e Boas Práticas

### Segurança
- **Toda** tabela em `public` precisa de `GRANT` explícito + RLS + policies.
- Roles **apenas** em `user_roles` (nunca em `profiles`).
- Nunca confiar em estado client-side (`localStorage`) para autorização.
- `service_role` e senha do banco **não estão disponíveis** no Lovable Cloud.

### Código
- Componentes pequenos e focados; preferir composição.
- Sem cores hardcoded — usar tokens semânticos.
- `src/integrations/supabase/client.ts` e `types.ts` são auto-gerados — **não editar**.
- `supabase/config.toml` gerenciado pela plataforma.

### Dados
- Queries client usam o client Supabase importado de `@/integrations/supabase/client`.
- Cache e refetch via TanStack Query (`useQuery`, `useMutation`).
- Realtime opcional via `supabase.channel(...)` quando necessário.

---

## 11. Glossário rápido

| Termo | Significado |
|---|---|
| Área | Unidade organizacional (ex: Marketing, RH) |
| KPI | Indicador-chave de performance |
| Etapa | Marco de execução dentro de um projeto |
| ATA | Ata de reunião importada e processada por IA |
| Coordenação | Role com visão global e poder de aprovação |
| Líder de Área | Role com escopo restrito à própria área |
