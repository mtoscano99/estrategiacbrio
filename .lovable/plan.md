

## Grafico de Gastos por Etapa no Detalhe do Projeto

### O que sera feito
Adicionar um card com grafico de barras horizontais mostrando o valor gasto de cada etapa do projeto, posicionado apos o card de Orcamento e antes da descricao.

### Detalhes

**Componente**
- Usar `BarChart` do Recharts (ja instalado) com barras horizontais (`layout="vertical"`)
- Cada barra representa uma etapa, com o nome no eixo Y e o valor em R$ no eixo X
- Filtrar apenas etapas com `valor_gasto > 0` para evitar barras vazias
- Se nenhuma etapa tiver gasto, exibir mensagem "Nenhum gasto registrado"

**Posicionamento**
- Novo card inserido logo apos os 3 cards de overview (Progresso, Orcamento, Periodo) e antes do card de Descricao
- Titulo: "Gastos por Etapa"

**Visual**
- Usar `ChartContainer` e `ChartTooltip` do sistema de charts existente (`@/components/ui/chart`)
- Tooltip formatado em BRL
- Cores usando variavel CSS `--primary`
- Altura dinamica baseada no numero de etapas (minimo 200px)

### Alteracoes

**Arquivo: `src/pages/ProjetoDetalhe.tsx`**
- Importar `BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip` de `recharts`
- Adicionar novo `<Card>` com o grafico entre os overview cards e a descricao
- Dados derivados do state `etapas` existente, sem queries adicionais
