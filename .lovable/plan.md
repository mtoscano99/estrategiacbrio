

## Plano: Geração de Relatório DOCX Profissional

### O que será feito

Adicionar funcionalidade de gerar um documento `.docx` profissional diretamente do sistema, seguindo o formato exato do documento anexado (capa institucional, sumário, resumo executivo, SWOT, objetivos, planos de ação, orçamento, KPIs, riscos, cronograma Gantt e considerações finais). Os dados são preenchidos a partir do projeto selecionado, e seções com dados insuficientes são complementadas pela IA.

### Estrutura do documento gerado

1. **Capa** — Nome da organização, título do projeto, subtítulo (área + prazo), data, diretoria
2. **Sumário** (Table of Contents)
3. **Resumo Executivo** — Descrição do projeto (dados do banco ou gerado por IA)
4. **Direcionadores Estratégicos** — Objetivo estratégico vinculado, área estratégica (gerado por IA se insuficiente)
5. **Diagnóstico e Análise** — Tabela de etapas com criticidade, situação atual vs desejada, **Análise SWOT** (dados da tabela `swot_items`)
6. **Objetivos e Metas** — Etapas agrupadas por período/mês, com indicadores e metas
7. **Planos de Ação** — Tabela detalhada de etapas: Área, Ação, Responsável, Início, Término, Entrega
8. **Orçamento Estimado** — Tabela com valores por etapa + total do projeto
9. **Monitoramento e Avaliação** — KPIs vinculados ao projeto (tabela `kpis` + `kpi_medicoes`)
10. **Cronograma Geral** — Gantt simplificado baseado nas datas das etapas
11. **Considerações Finais** — Gerado por IA a partir do contexto do projeto

### Implementação

**1. Instalar dependências**
- `docx` (v9.x) — gera documentos .docx no browser
- `file-saver` — download do arquivo gerado

**2. Criar gerador de DOCX** (`src/lib/docxGenerator.ts`)
- Função `generateProjectDocx(projectData, etapas, swotItems, kpis)` que monta o Document seguindo exatamente as cores, fontes, bordas e layout do código JS fornecido
- Helpers: `headerCell`, `cell`, `heading1/2/3`, `para`, `ganttRow` — mesma lógica do código fornecido
- Cores: ACCENT `#156082`, ACCENT_DARK `#0F4761`, HEADER_BG `#D5E8F0`, LIGHT_BG `#F2F8FB`
- Fonte: Aptos em todo o documento

**3. Criar gerador de conteúdo IA** — Novo modo `docx` na edge function `ai-project-assistant`
- Recebe contexto do projeto e retorna textos para seções faltantes (resumo executivo, direcionadores, diagnóstico, considerações finais)
- Retorno estruturado via tool calling

**4. Adicionar botão "Gerar DOCX"** em `src/pages/Relatorios.tsx`
- Na aba "Relatório de Projeto", ao lado do botão Imprimir
- Ao clicar: busca dados complementares (SWOT, KPIs), chama IA para preencher lacunas, gera o DOCX e faz download
- Loading state durante geração

**5. Buscar dados adicionais para o documento**
- `swot_items` do projeto
- `kpis` vinculados ao objetivo do projeto + últimas medições
- Dados já carregados: projeto, etapas, área, objetivo, responsável

### Arquivos

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar `docx` e `file-saver` |
| `src/lib/docxGenerator.ts` | **Novo** — Gerador completo do documento |
| `src/pages/Relatorios.tsx` | Botão "Gerar DOCX" + lógica de busca de dados e chamada IA |
| `supabase/functions/ai-project-assistant/index.ts` | Novo modo `docx` para gerar textos complementares |

### Detalhes técnicos

- `docx` funciona no browser via `Packer.toBlob()` (sem necessidade de Node.js/fs)
- `file-saver` usa `saveAs(blob, filename)` para download
- O documento segue fielmente o layout do código JS fornecido: mesmas cores, bordas, espaçamentos, tabelas com shading alternado
- Dados dinâmicos: nome do projeto, etapas, SWOT, orçamento, datas, responsáveis são do banco
- Dados gerados por IA: resumo executivo, direcionadores estratégicos, diagnóstico situacional, considerações finais — apenas quando o projeto não tem descrição suficiente

