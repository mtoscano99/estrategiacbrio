

## Plano de Correções

### 1. Corrigir erro de build no CSS (src/index.css)

O seletor CSS com colchetes escapados na linha 204 causa erro no PostCSS. Substituir por seletores de classe simples ou remover o bloco problemático.

### 2. Calendário: etapas vencidas em vermelho (src/pages/Calendario.tsx)

A lógica de cor já existe parcialmente em `getEventStyle` e `getDotColor` — etapas com `dataFim` no passado e status diferente de "concluido" ficam vermelhas. Verificar se está funcionando corretamente e garantir que a checagem usa `startOfDay` para comparação precisa (evitar que etapas com prazo hoje apareçam como vencidas).

### 3. Cards separados de Orçado vs Realizado (src/pages/ProjetoDetalhe.tsx)

Atualmente orçamento e gasto estão no mesmo card (linhas 555-581). Separar em dois cards distintos:

- **Card "Orçamento Previsto"**: valor de `orcamento_previsto`, ícone DollarSign, centro de custo
- **Card "Realizado"**: valor de `valor_gasto`, percentual consumido (gasto/orçamento), barra de progresso financeiro

O grid passa de `sm:grid-cols-3` para `sm:grid-cols-2 lg:grid-cols-4` para acomodar os 4 cards (Progresso, Orçamento, Realizado, Período).

