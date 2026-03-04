

## Plano: Pastas de Projetos, KPIs vinculados a Projetos e Extração automática de KPIs

### 3 funcionalidades solicitadas

1. **Pastas/Categorias de projetos** — Organizar projetos em macropastas (ex: "Ministeriais", "Administrativos")
2. **KPIs vinculados a projetos** — Ao criar KPI, escolher o projeto; ao entrar no projeto, ver seus KPIs com input de medições
3. **Extração automática de KPIs dos documentos** — Botão para extrair KPIs dos projetos importados via documento

---

### 1. Pastas de projetos (nova tabela `categorias_projeto`)

**Migration SQL:**
- Criar tabela `categorias_projeto` (id, nome, descricao, cor, created_at) com RLS
- Adicionar coluna `categoria_id` na tabela `projetos` referenciando `categorias_projeto`

**UI — `Projetos.tsx`:**
- Adicionar filtro por categoria no topo (junto aos filtros existentes)
- Agrupar projetos por categoria visualmente (seções colapsáveis com nome da pasta)
- Botão "Gerenciar Categorias" abre dialog para criar/editar/excluir categorias
- No card de projeto e em NovoProjeto, select para escolher categoria

**UI — `NovoProjeto.tsx` e `ImportarProjetosMassa.tsx`:**
- Adicionar select de categoria no formulário

---

### 2. KPIs vinculados a projetos

**Migration SQL:**
- Adicionar coluna `projeto_id uuid REFERENCES projetos(id)` na tabela `kpis` (nullable)

**UI — `NovoKPIDialog.tsx`:**
- Adicionar select "Projeto" que carrega lista de projetos para vincular o KPI

**UI — `ProjetoDetalhe.tsx`:**
- Nova seção "Indicadores (KPIs)" após SWOT/Etapas
- Lista os KPIs do projeto com valor atual, meta, sparkline e botão para registrar medição
- Botão "Novo KPI" pré-preenchido com `projeto_id`

**UI — `KPIs.tsx` e `KPIDetalhe.tsx`:**
- Exibir nome do projeto vinculado no card/badge quando houver

---

### 3. Extração automática de KPIs dos documentos

**Edge function — atualizar `import-projects-bulk`:**
- Adicionar campo `kpis` no schema de tool calling: `kpis: [{ nome, descricao, unidade, meta, periodicidade }]`
- A IA extrairá KPIs de cada projeto do documento

**UI — `ImportarProjetosMassa.tsx`:**
- Exibir KPIs extraídos em accordion dentro de cada projeto (similar a etapas)
- Na criação em lote, inserir KPIs na tabela `kpis` com `projeto_id` vinculado

**UI — `ProjetoDetalhe.tsx` (botão dedicado):**
- Botão "Extrair KPIs com IA" na seção de KPIs do projeto
- Chama edge function `ai-project-assistant` com modo `extract-kpis` passando contexto do projeto
- Exibe sugestões de KPIs para aceitar/rejeitar (mesmo padrão das sugestões de etapas)

---

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Nova tabela `categorias_projeto`, coluna `categoria_id` em projetos, coluna `projeto_id` em kpis |
| `src/pages/Projetos.tsx` | Filtro e agrupamento por categoria, dialog de gestão |
| `src/pages/NovoProjeto.tsx` | Select de categoria |
| `src/pages/ImportarProjetosMassa.tsx` | Select de categoria, accordion de KPIs, inserção em lote |
| `src/pages/ProjetoDetalhe.tsx` | Seção KPIs do projeto, botão extrair KPIs com IA |
| `src/components/kpis/NovoKPIDialog.tsx` | Select de projeto |
| `src/pages/KPIs.tsx` | Exibir projeto vinculado |
| `src/pages/KPIDetalhe.tsx` | Badge do projeto |
| `src/components/kpis/KPICard.tsx` | Exibir nome do projeto |
| `supabase/functions/import-projects-bulk/index.ts` | Schema de KPIs no tool calling |
| `supabase/functions/ai-project-assistant/index.ts` | Novo modo `extract-kpis` |

