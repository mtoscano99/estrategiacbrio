

## Plano: Importação em Massa de Projetos via Documento

### Resumo
Reutilizar a mesma lógica de importação de documento existente, mas com uma nova edge function que extrai **múltiplos projetos** de um único documento, e uma nova página para revisar/editar todos antes de criá-los em lote.

### Implementação

**1. Nova edge function `import-projects-bulk/index.ts`**
- Copia a lógica de extração de texto (DOCX/PDF/TXT) do `import-project-doc`
- Altera o prompt da IA para pedir extração de **múltiplos projetos**
- Tool calling retorna `{ projetos: [{ nome, descricao, data_inicio, data_fim, orcamento_previsto, centro_custo, etapas, swot }, ...] }`
- Registrar em `supabase/config.toml` com `verify_jwt = false`

**2. Nova página `src/pages/ImportarProjetosMassa.tsx`**
- Drag-and-drop + botão de upload (mesmo padrão do NovoProjeto)
- Após processamento, exibe lista de cards editáveis — um por projeto extraído
- Cada card: nome, descrição, datas, orçamento, centro de custo editáveis
- Checkbox para incluir/excluir cada projeto
- Accordion colapsável para etapas e SWOT de cada projeto
- Seletores globais de área estratégica e responsável (aplicar a todos)
- Botão "Criar X projetos" que insere todos em lote (projetos + etapas + SWOT)

**3. Rota e navegação**
- `src/App.tsx`: nova rota `/importar-projetos` protegida dentro do AppLayout
- `src/pages/Projetos.tsx`: botão "Importar em Massa" ao lado do "Novo Projeto"

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/import-projects-bulk/index.ts` | **Novo** — edge function para múltiplos projetos |
| `supabase/config.toml` | Registrar nova function |
| `src/pages/ImportarProjetosMassa.tsx` | **Novo** — página de importação em massa |
| `src/App.tsx` | Adicionar rota |
| `src/pages/Projetos.tsx` | Botão de acesso |

