

# Fluxo Completo de KPIs -- Criacao, Alimentacao e Acompanhamento

## Resumo

Criar um sistema completo de gestao de KPIs que permita cadastrar indicadores, registrar medicoes periodicas e visualizar o progresso ao longo do tempo. Isso vai alem dos "alvos" ja existentes no planejamento estrategico, oferecendo um painel dedicado com graficos de evolucao e formularios de alimentacao.

## O que sera construido

### 1. Nova tabela `kpis` (indicadores)
Armazena a definicao de cada KPI:

| Coluna         | Tipo      | Descricao                                      |
|----------------|-----------|-------------------------------------------------|
| id             | uuid (PK) | Identificador unico                             |
| nome           | text      | Nome do KPI (ex: "Frequencia Presencial")       |
| descricao      | text      | Descricao detalhada                             |
| unidade        | text      | Unidade de medida (%, R$, unidades, pessoas)    |
| meta           | numeric   | Valor-alvo a ser alcancado                      |
| area_id        | uuid (FK) | Area estrategica vinculada (opcional)            |
| objetivo_id    | uuid (FK) | Objetivo estrategico vinculado (opcional)        |
| periodicidade  | text      | mensal, trimestral, semestral, anual            |
| criado_por     | uuid (FK) | Usuario que criou                                |
| created_at     | timestamp | Data de criacao                                  |
| updated_at     | timestamp | Data de atualizacao                              |

### 2. Nova tabela `kpi_medicoes` (registros de medicao)
Armazena cada medicao/alimentacao do KPI:

| Coluna         | Tipo      | Descricao                                      |
|----------------|-----------|-------------------------------------------------|
| id             | uuid (PK) | Identificador unico                             |
| kpi_id         | uuid (FK) | Referencia ao KPI                               |
| valor          | numeric   | Valor medido                                    |
| data_referencia| date      | Data/periodo da medicao                         |
| observacao     | text      | Comentario opcional sobre a medicao             |
| registrado_por | uuid (FK) | Usuario que registrou                            |
| created_at     | timestamp | Data do registro                                 |

### 3. Politicas de seguranca (RLS)

- **kpis**: Coordenacao pode criar/editar/excluir; todos autenticados podem ler
- **kpi_medicoes**: Coordenacao pode tudo; lideres podem inserir e ler medicoes da sua area; todos autenticados podem ler

### 4. Nova pagina `/kpis` -- Painel de KPIs

Tela principal com:
- **Cards resumo** no topo: total de KPIs, KPIs no alvo, KPIs abaixo da meta, KPIs sem medicao recente
- **Lista/grid de KPIs** com barra de progresso visual (valor atual vs meta), filtros por area e periodicidade
- **Mini-grafico sparkline** em cada card mostrando tendencia das ultimas medicoes

### 5. Dialog/Modal para criar novo KPI

Formulario com campos:
- Nome, descricao, unidade de medida
- Meta (valor numerico alvo)
- Area estrategica (select das areas existentes)
- Objetivo estrategico (select filtrado por area)
- Periodicidade (mensal/trimestral/semestral/anual)

Disponivel apenas para coordenacao.

### 6. Dialog/Modal para registrar medicao

Formulario simples:
- KPI (pre-selecionado se aberto de um KPI especifico)
- Valor medido
- Data de referencia
- Observacao (opcional)

Disponivel para coordenacao e lideres de area (para KPIs da sua area).

### 7. Pagina de detalhe do KPI `/kpis/:id`

- Informacoes do KPI (nome, descricao, meta, area, objetivo)
- Grafico de linha mostrando evolucao das medicoes ao longo do tempo com linha de meta
- Tabela com historico completo de medicoes
- Botao para adicionar nova medicao
- Botao para editar o KPI (somente coordenacao)

### 8. Integracao com sidebar e Dashboard

- Adicionar item "KPIs" na sidebar (icone BarChart3)
- Adicionar secao no Dashboard com os 4-5 KPIs mais relevantes e seus status

## Detalhes Tecnicos

### Migracao SQL
Uma unica migracao criando:
- Tabela `kpis` com foreign keys para `areas_estrategicas`, `objetivos_estrategicos` e `profiles`
- Tabela `kpi_medicoes` com foreign keys para `kpis` e `profiles`
- Politicas RLS permissivas para leitura autenticada e restritivas para escrita por perfil
- Trigger `update_updated_at_column` na tabela `kpis`

### Novos arquivos
- `src/pages/KPIs.tsx` -- listagem com cards, filtros e resumo
- `src/pages/KPIDetalhe.tsx` -- pagina de detalhe com grafico de evolucao
- `src/components/kpis/NovoKPIDialog.tsx` -- formulario de criacao
- `src/components/kpis/NovaMedicaoDialog.tsx` -- formulario de alimentacao
- `src/components/kpis/KPICard.tsx` -- card individual com progresso

### Arquivos modificados
- `src/App.tsx` -- novas rotas `/kpis` e `/kpis/:id`
- `src/components/layout/AppSidebar.tsx` -- novo item "KPIs" no menu
- `src/pages/Dashboard.tsx` -- secao com resumo dos KPIs principais

### Bibliotecas utilizadas (ja instaladas)
- `recharts` para graficos de evolucao
- `react-hook-form` + `zod` para validacao dos formularios
- Componentes shadcn/ui existentes (Dialog, Card, Select, Input, Badge, Progress)

