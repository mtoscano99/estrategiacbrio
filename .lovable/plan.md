

## Dashboard Financeiro Consolidado

### Objetivo
Adicionar uma secao financeira ao Dashboard principal com visao consolidada de orcamento vs gasto, % de consumo por area estrategica e graficos comparativos. Tudo na pagina `Dashboard.tsx` existente, sem criar pagina nova.

### O que sera adicionado

**1. Cards financeiros (nova linha apos os cards existentes de status)**
- Orcamento Total (soma de `orcamento_previsto` de todos os projetos)
- Total Gasto (soma de `valor_gasto`)
- Saldo Restante (orcamento - gasto)
- % Consumo Geral (gasto / orcamento * 100)

**2. Grafico de barras comparativo: Orcamento vs Gasto por Area**
- Barras lado a lado (grouped bar chart) usando Recharts
- Eixo X: areas estrategicas
- Duas barras por area: orcamento (azul) e gasto (vermelho/laranja)
- Tooltip com valores formatados em BRL

**3. Grafico de barras horizontal: % Consumo por Area**
- Barra horizontal mostrando a porcentagem consumida de cada area
- Cores condicionais: verde (<50%), amarelo (50-80%), vermelho (>80%)

### Detalhes Tecnicos

**Arquivo: `src/pages/Dashboard.tsx`**

1. Alterar a query existente de projetos para incluir `orcamento_previsto` e `valor_gasto`:
   - De: `select("id, status, area_id, areas_estrategicas(nome)")`
   - Para: `select("id, status, area_id, orcamento_previsto, valor_gasto, areas_estrategicas(nome)")`

2. Adicionar novos estados:
   - `financeiroTotal`: objeto com `orcamento`, `gasto`, `saldo`, `percentual`
   - `financeiroPorArea`: array com `{ nome, orcamento, gasto, percentual }` para os graficos

3. Processar dados financeiros dentro do `loadData` existente, junto com os dados de projetos ja carregados (sem query adicional ao banco)

4. Adicionar secao de cards financeiros apos os cards de KPI existentes, com icones `DollarSign`, `TrendingDown`, `Wallet`, `Percent`

5. Adicionar dois novos graficos na grid de graficos existente (ou em uma nova grid abaixo):
   - BarChart agrupado (orcamento vs gasto por area) usando duas `<Bar>` com `dataKey` diferentes
   - BarChart horizontal (% consumo por area) com barras coloridas condicionalmente

6. Funcao helper `fmtBRL` para formatar valores em Reais (reutilizando o padrao do Relatorios.tsx)

### Layout final do Dashboard (ordem dos blocos)

```text
[Cards de Status: Total | Em Andamento | Atrasados | Concluidos]
[Cards Financeiros: Orcamento | Gasto | Saldo | % Consumo]
[Graficos: Projetos por Area | Status dos Projetos]
[Graficos: Orcamento vs Gasto por Area | % Consumo por Area]
[Proximos Marcos / Entregas]
[Indicadores (KPIs)]
```

### Nenhuma alteracao de banco necessaria
Todos os dados ja existem nos campos `orcamento_previsto` e `valor_gasto` da tabela `projetos`.

