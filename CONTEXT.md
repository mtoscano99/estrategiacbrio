# CBRio — Sistema de Gestão Estratégica

> Documento técnico-narrativo do sistema. Serve como referência para o time de desenvolvimento **e** como fonte de matéria-prima para posts no LinkedIn sobre a construção do produto. Cada seção termina com **"Ângulo para post"** sugerindo um gancho editorial.

---

## 1. Pitch

O **CBRio Estratégia** é a plataforma interna que substituiu planilhas dispersas por um sistema único de gestão estratégica para uma organização com múltiplas áreas, dezenas de projetos simultâneos e dois níveis de governança (Coordenação e Líderes de Área).

Três promessas centrais:
- **Visibilidade total** — todos os projetos, KPIs, etapas e gastos em um só lugar, com filtros por área e status.
- **Governança com escopo** — coordenação vê tudo; líderes de área enxergam apenas o que é deles, sem hacks de front-end.
- **IA aplicada no dia a dia** — importação de projetos por documento, processamento automático de ATAs e assistente conversacional contextual.

**Ângulo para post:** "Como trocamos 12 planilhas por um único sistema com IA em poucas semanas."

---

## 2. O problema

Antes do sistema:
- **Planilhas paralelas** por área, cada uma com sua própria estrutura.
- **Status desatualizado** porque ninguém queria abrir 8 abas para reportar.
- **ATAs perdidas** em e-mails e Drives — decisões importantes sumiam.
- **Coordenação cega** sobre o agregado: quanto já foi gasto? quantos projetos estão atrasados? quem é responsável pelo quê?
- **Líderes de área sobrecarregados** com pedidos manuais de relatório.

Por que não um SaaS pronto (Asana, Monday, ClickUp):
- Modelo de governança próprio (Coordenação vs. Líder de Área) não se encaixava nos perfis padrão.
- Necessidade de IA contextual sobre **decisões institucionais** (ATAs, importação de documentos).
- Custo previsível e dado dentro de casa.
- Personalização total do fluxo de aprovação e dos relatórios financeiros.

**Ângulo para post:** "O dia em que aceitamos que nosso processo não cabia no Monday."

---

## 3. Visão de produto

### Personas

| Persona | Permissões | Necessidades principais |
|---|---|---|
| **Coordenação** | Visão global, aprovações, gestão de todas as áreas | Painel agregado, aprovar/reprovar, exportar relatórios |
| **Líder de Área** | Escopo restrito à sua área | Cadastrar projetos, atualizar etapas, registrar KPIs, anexar documentos |

### Jornadas principais
1. **Planejamento** → Líder cria projeto, define área, responsáveis, etapas e KPIs.
2. **Execução** → Atualiza etapas, lança valores gastos, anexa documentos, registra contatos externos.
3. **Governança** → Coordenação acompanha pelo dashboard, aprova mudanças, gera relatórios.
4. **Reuniões** → Importa ATA → IA extrai decisões → vira ações vinculadas a projetos.
5. **Insights** → Dashboard, calendário de etapas, relatórios financeiros, planejamento estratégico (SWOT).

### Diferenciais
- Múltiplos responsáveis por projeto (tabela de junção dedicada).
- Importação de projetos em massa por documento (PDF/DOCX) com IA.
- ATAs viram dados estruturados automaticamente.
- Matriz SWOT integrada ao planejamento.
- Geração de DOCX no client (relatórios sem servidor extra).

**Ângulo para post:** "Personas reais, não as do template: como mapear governança que SaaS genéricos não cobrem."

---

## 4. Arquitetura em camadas

```text
┌──────────────────────────────────────────────────────────┐
│  Browser — React 18 SPA (Vite + TypeScript + Tailwind)   │
│  - Rotas protegidas por sessão + role                    │
│  - TanStack Query como cache de server-state             │
│  - shadcn/ui sobre Radix primitives                      │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS (PostgREST + Auth + Storage)
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Lovable Cloud (Supabase open-source por baixo)          │
│  - PostgreSQL gerenciado com RLS em todas as tabelas     │
│  - Auth: email/senha + Google OAuth                      │
│  - Storage: avatars + project-attachments                │
│  - Edge Functions (Deno) para integrações e IA           │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP server-to-server
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Lovable AI Gateway  →  Google Gemini-3-Flash            │
│  - Sem chave de API gerenciada pelo cliente              │
│  - Billing por uso integrado ao workspace                │
└──────────────────────────────────────────────────────────┘
```

Princípios:
- **Client burro, servidor inteligente.** Toda regra de autorização é validada no Postgres via RLS — o front-end não decide nada que importe.
- **Edge functions só para o que não pode ser feito via PostgREST**: IA, parsing de documentos, lógicas multi-tabela complexas.
- **Sem backend próprio.** Não há container, não há Dockerfile, não há fila — tudo gerenciado.

**Ângulo para post:** "Arquitetura serverless de verdade: como rodamos um sistema corporativo sem nenhum servidor próprio."

---

## 5. Stack — o quê, por quê, alternativa

| Camada | Escolha | Por quê | Alternativa descartada |
|---|---|---|---|
| Linguagem | **TypeScript 5** | Tipos vindos do schema do banco evitam bugs de domínio | JavaScript puro |
| UI | **React 18** | Ecossistema, contratação, shadcn | Vue, Svelte |
| Build | **Vite 5** | HMR rápido, SPA simples | Next.js (não precisamos de SSR) |
| Estilo | **Tailwind v3 + tokens semânticos** | Velocidade + dark mode + theming | CSS-in-JS, MUI |
| Componentes | **shadcn/ui (Radix)** | Código nosso, acessibilidade nativa | MUI, Chakra (lock-in maior) |
| Forms | **react-hook-form + zod** | Validação tipada, performance | Formik |
| Server state | **TanStack Query v5** | Cache, refetch, mutações otimistas | Redux, SWR |
| Rotas | **React Router v6** | Padrão de SPA | TanStack Router |
| Backend | **Lovable Cloud (Supabase)** | Postgres real, RLS, auth, storage, functions — sem ops | Backend Node próprio + Auth0 |
| Banco | **PostgreSQL gerenciado** | RLS sério, funções `SECURITY DEFINER`, JSONB quando preciso | Firebase, DynamoDB |
| IA | **Lovable AI Gateway + Gemini-3-Flash** | Sem gerenciar chave Google, billing unificado | OpenAI direto |
| DOCX | **`docx` no client** | Relatório sem round-trip ao servidor | Geração server-side |
| Testes | **Vitest** | Roda em cima do Vite, zero config extra | Jest |
| Notificações | **Sonner + Toaster** | Padrão shadcn | react-toastify |
| Ícones | **lucide-react** | Tree-shakeable, consistente com shadcn | Font Awesome |

**Ângulo para post:** "Por que escolhemos Vite em vez de Next.js para um sistema interno."

---

## 6. Modelo de dados — deep dive

### Diagrama (texto)

```text
auth.users ──1:1── profiles ──N:1── areas
                     │
                     ├──1:N── user_roles            (separada por segurança)
                     ├──N:N── projeto_responsaveis ──N:1── projetos
                     │
projetos ──N:1── areas
   │
   ├──1:N── etapas_projeto      (trigger soma valor_gasto)
   ├──1:N── anexos_projeto      (FK lógica para storage)
   ├──1:N── contatos_externos
   ├──1:N── kpis ──1:N── medicoes_kpi
   ├──1:N── aprovacoes
   └──notificacoes (por user_id)
```

### Tabelas

| Tabela | Propósito | Política RLS resumida |
|---|---|---|
| `areas` | Unidades organizacionais | Leitura para todos autenticados |
| `profiles` | Dados pessoais + área | Usuário lê/edita o próprio; coordenação lê todos |
| `user_roles` | **Roles isoladas** | Leitura via `has_role()`; nunca acessada do client diretamente |
| `projetos` | Projetos estratégicos | Coordenação total; líder via `user_in_project_area()` |
| `projeto_responsaveis` | Junção N:N projeto↔profile | Mesma área do projeto |
| `etapas_projeto` | Marcos com `valor_gasto` | Mesma do projeto |
| `kpis` / `medicoes_kpi` | Indicadores e histórico | Por área |
| `contatos_externos` | Stakeholders | Por área |
| `anexos_projeto` | Metadados de storage | Por área |
| `aprovacoes` | Workflow de aprovação | Solicitante e coordenação |
| `notificacoes` | Alertas in-app | Apenas o destinatário |

### Padrões de segurança não-negociáveis

- **Roles em tabela separada.** Nunca em `profiles`. Evita classe inteira de privilege escalation (usuário editando próprio profile = virando admin).
- **Funções `SECURITY DEFINER`** quebram a recursão de RLS:
  - `has_role(user_id, role)` — checagem genérica
  - `get_user_area_id(user_id)` — área do usuário
  - `user_in_project_area(user_id, projeto_id)` — escopo por área
- **GRANT explícito** em toda tabela `public` — sem isso, PostgREST devolve 401 mesmo com RLS configurado.
- **Triggers de domínio:**
  - `handle_new_user` cria profile + role no signup (apenas email/senha; Google entra sem role de propósito).
  - `sync_projeto_valor_gasto` mantém `projetos.valor_gasto` em sincronia com a soma das etapas.
  - `update_updated_at_column` em tabelas auditadas.

**Ângulo para post:** "Erro #1 de segurança em apps Supabase: guardar role na tabela profiles."

---

## 7. Autenticação e autorização — caso de estudo

### Fluxo

1. Usuário acessa `/login` → email/senha **ou** Google OAuth (via `@lovable.dev/cloud-auth-js`).
2. `supabase.auth.onAuthStateChange` dispara → `AuthContext` busca `profile` + `role` em paralelo.
3. Se **role ausente** → redirect para `/selecionar-perfil`.
4. Se role presente → libera `AppLayout` com sidebar.

### Bug real vivido em produção

**Sintoma:** usuários Google logavam, sessão aparecia no Cloud, mas não entravam no sistema. Ficavam num loading infinito.

**Causa raiz:** dois problemas combinados:
- O trigger `handle_new_user` só cria role quando `raw_user_meta_data.role` existe — Google não manda isso.
- A query de role rodava antes do Supabase client receber os headers de auth, retornando "no rows".

**Correção:**
- `setTimeout(..., 0)` no `onAuthStateChange` para diferir as queries.
- Fallback de 2s usando `getSession()` caso `INITIAL_SESSION` não dispare.
- Tela `/selecionar-perfil` como guard rail explícito em vez de loading silencioso.

### Trecho-chave (`AuthContext.tsx`)

```ts
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    setSession(session);
    if (session?.user) {
      // Defer DB calls — Supabase ainda está configurando headers
      setTimeout(() => {
        Promise.all([fetchProfile(userId), fetchRole(userId)])
          .then(() => setLoading(false));
      }, 0);
    }
  }
);
```

**Ângulo para post:** "O bug invisível do Supabase + Google OAuth que travou meu app por 3 dias."

---

## 8. IA aplicada

### Lovable AI Gateway

- Endpoint único, sem gerenciar chave do Google.
- Modelo padrão: **Gemini-3-Flash** (rápido, barato, contexto longo).
- Billing pelo workspace Lovable, não por conta na Google Cloud.
- Disponível dentro de Edge Functions via `LOVABLE_API_KEY` (server-side only).

### Casos de uso reais no sistema

**1. `process-ata` — ATAs viram dados estruturados**
Entrada: texto livre de ata de reunião.
Saída: JSON com decisões, responsáveis, prazos e vínculos a projetos.
Impacto: o que era um doc no Drive vira uma timeline pesquisável.

**2. `ai-project-assistant` — Assistente contextual**
Conversa sobre um projeto específico com acesso aos dados dele (etapas, valores, KPIs).
Casos: "qual o gargalo deste projeto?", "resuma o status para a coordenação".

**3. `import-project-doc` / `import-projects-bulk` — Documento vira projeto**
Líder solta um PDF/DOCX do briefing → IA estrutura em projeto + etapas + responsáveis sugeridos.
Reduz cadastro manual de ~20 min para ~2 min.

### Padrão de implementação

Toda chamada de IA fica em Edge Function:
- A chave nunca toca o browser.
- Validação de input antes do prompt.
- Schema de saída tipado (zod) quando estruturado.
- Erros 429/402 do gateway aparecem como mensagens claras na UI.

**Ângulo para post:** "Como transformamos atas de reunião em ações rastreáveis com 80 linhas de código."

---

## 9. Edge Functions — anatomia

| Função | Runtime | `verify_jwt` | Entrada | Saída |
|---|---|---|---|---|
| `assign-role` | Deno | false | `{ user_id, role }` | `{ ok }` |
| `ai-project-assistant` | Deno | false | `{ projeto_id, mensagens[] }` | stream de texto |
| `import-project-doc` | Deno | false | arquivo + `area_id` | projeto criado |
| `import-projects-bulk` | Deno | false | arquivo multi-projeto | array de projetos |
| `process-ata` | Deno | false | texto da ata + `projeto_id?` | JSON estruturado |

Todas vivem em `supabase/functions/<nome>/index.ts` e fazem deploy automático ao salvar.

**Ângulo para post:** "5 edge functions que substituíram um backend inteiro."

---

## 10. Frontend — padrões de UI

- **AppLayout + AppSidebar** colapsável, navegação consistente.
- **Componentes de domínio reutilizáveis:**
  - `ResponsavelCombobox` — busca tipada de profiles, com criação inline.
  - `SWOTMatrix` — matriz interativa (forças/fraquezas/oportunidades/ameaças).
  - `KPICard` — visualização de indicador com tendência.
  - `NovaMedicaoDialog`, `NovoKPIDialog`, `NovaEtapaCalendarioDialog` — pattern de "dialogs de domínio" em vez de formulários soltos.
- **`docxGenerator`** — biblioteca `docx` no client, gera relatório completo (capa, sumário, tabelas, gráficos) e dispara download. Zero round-trip ao servidor.
- **Calendário de etapas** com criação rápida.
- **NotificacoesDropdown** com badge de não-lidas, lido em realtime.
- **UserAvatar** com fallback de iniciais consistente.

### Design system
- Tokens semânticos em `src/index.css` (HSL).
- `tailwind.config.ts` mapeia tokens → classes utilitárias.
- Sem cores hardcoded em componentes — nada de `bg-[#fff]` ou `text-white`.

**Ângulo para post:** "Por que gerar DOCX no navegador e não no servidor."

---

## 11. Storage e arquivos

| Bucket | Público | Uso |
|---|---|---|
| `avatars` | sim | Foto de perfil de usuários |
| `project-attachments` | sim | Anexos de projetos (briefings, contratos, fotos) |

- Convenção de path: `{projeto_id}/{timestamp}_{nome_original}` para anexos.
- Metadados ficam em `anexos_projeto` com FK lógica para o caminho no bucket.
- Tamanho e tipo validados no client antes do upload.

**Ângulo para post:** "Storage gerenciado: como evitamos montar S3 + signed URLs do zero."

---

## 12. Fluxo de desenvolvimento

- **Build:** Lovable (auto-publica em `estrategiacbrio.lovable.app`).
- **Dev local:** `npm run dev` (porta 8080, HMR).
- **Migrations:** `supabase/migrations/<timestamp>_<uuid>.sql`, versionadas, aplicadas automaticamente.
- **Edge functions:** salvou → fez deploy.
- **Tipos do banco:** regenerados automaticamente em `src/integrations/supabase/types.ts`. **Nunca editar à mão.**
- **Secrets:** `LOVABLE_API_KEY`, `SUPABASE_*` — server-side only, injetados nas Edge Functions.
- **Preview vs Produção:** mesmo banco, URLs separadas, mesmas migrations.

**Ângulo para post:** "Pipeline sem GitHub Actions, sem Vercel, sem nada: por que isso virou produtivo."

---

## 13. Números do projeto (snapshot)

| Métrica | Valor |
|---|---|
| Páginas (rotas) | 18 |
| Componentes (arquivos em `src/components`) | ~79 |
| Migrations SQL aplicadas | 16+ |
| Edge functions | 5 |
| Tabelas em `public` | ~12 |
| Storage buckets | 2 |
| Modelos de IA em uso | 1 (Gemini-3-Flash via Lovable AI) |
| Roles do sistema | 2 (`coordenacao`, `lider_area`) |

**Ângulo para post:** "Um sistema corporativo em N migrations e 5 edge functions."

---

## 14. Decisões técnicas marcantes

### 14.1 Múltiplos responsáveis: tabela de junção em vez de array

- **Contexto:** projetos passaram a ter 2–5 responsáveis.
- **Opções:** coluna `responsaveis uuid[]` em `projetos` vs. tabela `projeto_responsaveis`.
- **Escolha:** tabela de junção.
- **Por quê:** RLS por linha, joins simples, integridade referencial, histórico futuro (data de entrada/saída).
- **Resultado:** filtros e contagens triviais; políticas RLS legíveis.

### 14.2 Roles em tabela separada de `profiles`

- **Contexto:** evitar que update de profile = mudança de role.
- **Escolha:** `user_roles` + função `has_role` `SECURITY DEFINER`.
- **Resultado:** zero risco de privilege escalation via UPDATE em profiles.

### 14.3 Importação em massa via IA, não CSV

- **Contexto:** áreas mandavam projetos em DOCX/PDF, cada uma com formato diferente.
- **Opção descartada:** template CSV rígido (alta fricção, baixa adesão).
- **Escolha:** Edge function + Gemini extrai estrutura do documento original.
- **Resultado:** adesão imediata; líder de área não muda o jeito de trabalhar.

### 14.4 DOCX gerado no client

- **Contexto:** relatórios financeiros e executivos exportados em Word.
- **Opção descartada:** edge function de geração (cold start, peso de dependências).
- **Escolha:** lib `docx` rodando no browser.
- **Resultado:** download instantâneo, zero custo de servidor.

### 14.5 SPA em vez de Next.js

- **Contexto:** sistema interno, sem SEO, atrás de login.
- **Escolha:** Vite + React Router.
- **Resultado:** build mais rápido, deploy mais simples, sem complexidade de SSR/RSC.

### 14.6 Lovable Cloud em vez de backend próprio

- **Contexto:** equipe pequena, prazo curto.
- **Escolha:** Postgres gerenciado + RLS + Edge Functions.
- **Resultado:** zero ops, segurança séria de fábrica, foco 100% em produto.

**Ângulo para post:** Cada uma destas é um post completo. Comece pela 14.2 (rendeu mais engajamento em apps similares).

---

## 15. Roadmap / próximos passos (sugestões de conteúdo)

- Realtime nas notificações e em mudanças de projeto.
- Histórico de versões de projeto (auditoria).
- App mobile (PWA ou React Native).
- Mais modelos de IA: extração de risco, sugestão de KPI.
- Integração com calendários externos (Google Calendar) para etapas.
- Dashboards salvos por usuário.

**Ângulo para post:** "O que vem aí no nosso sistema de gestão estratégica."

---

## 16. Glossário

| Termo | Significado |
|---|---|
| **Área** | Unidade organizacional (Marketing, RH, TI, etc.) |
| **Projeto** | Iniciativa estratégica com escopo, prazo e orçamento |
| **Etapa** | Marco/entrega dentro de um projeto, com valor gasto |
| **KPI** | Indicador-chave; pode ter múltiplas medições no tempo |
| **ATA** | Ata de reunião importada e estruturada por IA |
| **Coordenação** | Role com visão global e poder de aprovação |
| **Líder de Área** | Role com escopo restrito à própria área |
| **SWOT** | Matriz Strengths/Weaknesses/Opportunities/Threats integrada ao planejamento |
| **Aprovação** | Workflow de mudança de status que exige assinatura da coordenação |

---

## 17. Referências internas

- `src/App.tsx` — mapa de rotas + guards
- `src/contexts/AuthContext.tsx` — sessão, role, profile
- `src/integrations/supabase/client.ts` — cliente (auto-gerado)
- `src/integrations/lovable/index.ts` — wrapper Google OAuth
- `supabase/functions/` — código Deno das edge functions
- `supabase/migrations/` — histórico do schema
- `src/lib/docxGenerator.ts` — geração de relatório Word
- `src/components/projetos/` — componentes de domínio de projetos

---

## Apêndice: ideias rápidas de posts (pronto para usar)

1. **"De 12 planilhas a 1 sistema"** — usar seção 2.
2. **"Role em tabela separada salva sua vida"** — seção 6 + 14.2.
3. **"O bug do Google OAuth que ninguém te conta"** — seção 7.
4. **"ATA vira ação: IA aplicada no boring stuff"** — seção 8.
5. **"Por que escolhi Vite em vez de Next.js"** — seção 5.
6. **"Stack 2026 para apps internos: React + Supabase + Lovable AI"** — seções 4 e 5.
7. **"Multi-responsável: tabela de junção vs. array em Postgres"** — seção 14.1.
8. **"DOCX no browser: 0 servidor, 100% velocidade"** — seção 10 + 14.4.
9. **"Serverless de verdade: 0 contêineres em produção"** — seção 4 + 12.
10. **"Como funciona o Lovable AI Gateway na prática"** — seção 8.
