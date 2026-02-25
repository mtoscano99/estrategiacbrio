

## Acompanhamento de Alvos e KPIs no Planejamento Estratégico

### Situação Atual
- A tabela `alvos_pe` armazena metas textuais vinculadas a objetivos estratégicos (ex: "Sustentabilidade do CBS1 nível 80%", meta: "80%")
- A tabela `kpis` armazena indicadores mensuráveis com medições numéricas (`kpi_medicoes`), e já possui campo `objetivo_id` para vincular ao mesmo objetivo
- Na página de PE, os alvos aparecem como texto estático sem progresso
- A página de KPIs existe separadamente em `/kpis`

### O que será feito

**1. Vincular alvos a KPIs na página de Planejamento Estratégico**

Para cada alvo exibido dentro de um objetivo, buscar os KPIs vinculados ao mesmo objetivo e exibir o progresso real ao lado do alvo.

**2. Adicionar indicadores visuais de progresso em cada alvo**

Cada item de alvo passará a mostrar:
- Barra de progresso (se houver KPI vinculado com medições)
- Badge de status: "No alvo", "Abaixo", "Sem dados"
- Último valor medido e a meta
- Link direto para o KPI detalhado (`/kpis/:id`)

**3. Adicionar resumo de progresso por objetivo**

No cabeçalho de cada objetivo (AccordionTrigger), mostrar:
- Quantidade de alvos com KPI vinculado vs total
- Percentual médio de atingimento dos alvos

**4. Botão de ação para vincular/criar KPI**

Para coordenadores, cada alvo sem KPI vinculado terá um botão "Criar KPI" que abre o dialog de criação de KPI já pré-preenchido com os dados do alvo (nome, meta, objetivo_id).

### Detalhes Técnicos

**Arquivo: `src/pages/PlanejamentoEstrategico.tsx`**

1. Alterar a query para buscar KPIs junto com suas últimas medições:
   - Adicionar: `supabase.from("kpis").select("id, nome, meta, unidade, objetivo_id")`
   - Adicionar: `supabase.from("kpi_medicoes").select("kpi_id, valor, data_referencia").order("data_referencia", { ascending: true })`

2. Criar função helper `kpisForObjetivo(objId)` que retorna os KPIs do objetivo com sua última medição e percentual de progresso

3. Para cada alvo renderizado, tentar associar um KPI pelo `objetivo_id` compartilhado. Exibir:
   - `Progress` component com percentual (valor/meta * 100)
   - Badge colorido de status
   - Texto com valor atual vs meta
   - Clique para navegar ao `/kpis/:id`

4. No `AccordionTrigger` de cada objetivo, adicionar badge resumo (ex: "3/4 alvos no alvo")

5. Importar `useNavigate`, `Progress`, `NovaMedicaoDialog` e `useAuth` para funcionalidades de navegação, progresso e criação

**Nenhuma alteração de banco necessária** — os dados e relações já existem via `objetivo_id` em ambas as tabelas.

### Layout visual de cada alvo (antes vs depois)

```text
ANTES:
| Sustentabilidade do CBS1 nível 80%     |
| Meta: 80%                               |
| Indicador: Percentual de sustentabilidade|

DEPOIS:
| Sustentabilidade do CBS1 nível 80%    [No alvo] |
| Meta: 80% · Atual: 72%                          |
| ████████████████████░░░░  90%                    |
| Indicador: Percentual de sustentabilidade  [→]   |
```

