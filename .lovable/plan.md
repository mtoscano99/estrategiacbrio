

## Relatórios Profissionais — Plano de Redesign

### Problema
Os relatórios atuais são básicos: listam dados em cards e tabelas simples sem seguir padrões profissionais de gestão de projetos (como relatórios de status executivo, portfólio PMO, etc.).

### O que será feito

**1. Relatório de Projeto (aba "Por Projeto" em Relatorios.tsx)** — Redesign completo para formato de Status Report executivo:

- **Cabeçalho institucional**: Logo CBRio, título "Relatório de Status do Projeto", data de geração, número do relatório
- **Resumo Executivo**: Card com status geral (semáforo), saúde, % progresso, responsável, período, área estratégica e objetivo estratégico
- **Indicadores-chave** em grid: Progresso (% etapas concluídas com barra visual), Financeiro (orçamento vs gasto com % consumo), Prazo (dias restantes ou atraso)
- **Cronograma visual**: Tabela de etapas com colunas Etapa, Responsável, Início, Fim, Status (badge colorido), Valor Gasto — formato profissional
- **Seção de observações/descrição** do projeto
- **Rodapé para impressão**: "CBRio – Gestão Estratégica – Gerado em DD/MM/AAAA"

**2. Relatório de Portfólio (aba "Portfólio" em Relatorios.tsx)** — Formato de Dashboard Executivo PMO:

- **Cabeçalho**: "Relatório de Portfólio de Projetos – CBRio", data, período de referência
- **Painel de Saúde do Portfólio**: Contadores visuais por status (quantos não iniciados, em andamento, concluídos, atrasados, cancelados) com ícones semáforo
- Manter gráficos e tabelas financeiras existentes (já estão bons)
- **Rodapé para impressão**

**3. Relatório Financeiro (RelatorioFinanceiro.tsx)** — Ajustes de profissionalismo:

- **Cabeçalho institucional** com título formal e data de geração
- Manter estrutura atual (já está boa) mas adicionar rodapé e cabeçalho no formato de impressão
- Melhorar print CSS para layout A4 profissional

**4. Print CSS global** em `src/index.css`:

- Estilos `@media print` para layout A4 limpo: esconder sidebar, esconder botões de ação, margens adequadas, cores de fundo visíveis, page-break entre seções

### Arquivos modificados
- `src/pages/Relatorios.tsx` — Redesign completo das duas abas
- `src/pages/RelatorioFinanceiro.tsx` — Cabeçalho/rodapé institucional
- `src/index.css` — Print styles profissionais

### Detalhes técnicos
- Dados já disponíveis no banco: projeto (nome, descrição, status, saúde, datas, orçamento, gasto, centro_custo), etapas (nome, responsável, datas, status, valor_gasto), áreas, objetivos
- Query de etapas já busca responsável via `responsavel_id` — precisa incluir join com profiles
- Formato de datas: `dd/MM/yyyy` usando date-fns/ptBR
- Componentes UI já existentes: Badge, Table, Progress, Card — sem dependências novas

