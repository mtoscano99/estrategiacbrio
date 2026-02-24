

# Calendario de Eventos - Projetos, Etapas e Marcos

## Resumo

Criar uma pagina de calendario completo estilo Google Calendar onde o usuario visualiza, dia a dia, seus projetos e etapas/marcos nos quais e responsavel. A visualizacao incluira modos mensal, semanal e diario, com eventos coloridos por tipo (projeto vs etapa) e status.

## O que muda para o usuario

1. Nova pagina **"Calendario"** acessivel pela sidebar (icone de calendario)
2. Visualizacao mensal com celulas de dia mostrando eventos (projetos e etapas com datas)
3. Navegacao entre meses (anterior/proximo/hoje)
4. Eventos coloridos por tipo:
   - **Projetos** (azul) - mostra data_inicio ate data_fim do projeto
   - **Etapas/Marcos** (verde/vermelho) - mostra data_inicio e data_fim da etapa, com vermelho se atrasada
5. Ao clicar em um evento, navega para o detalhe do projeto correspondente
6. Filtra automaticamente para mostrar apenas itens onde o usuario e responsavel (ou todos para coordenacao)
7. Badge com contagem de eventos quando ha mais do que cabem na celula

## Detalhes Tecnicos

### 1. Nova pagina `src/pages/Calendario.tsx`

- Estado para mes/ano atual com navegacao
- Carrega dados de duas fontes:
  - `projetos` - filtra por `responsavel_id = user.id` (ou todos para coordenacao), usa `data_inicio` e `data_fim`
  - `etapas_projeto` - filtra por `responsavel_id = user.id` (ou todas para coordenacao), usa `data_inicio` e `data_fim`, com join em `projetos(nome)`
- Monta grid de calendario: 7 colunas (Dom-Sab), linhas conforme semanas do mes
- Cada celula do dia lista os eventos daquele dia (inicio, fim, ou dentro do range)
- Eventos clicaveis que navegam para `/projetos/:id`
- Layout responsivo: em telas menores, mostra apenas indicadores (bolinhas coloridas) e ao clicar no dia expande lista

### 2. Componente auxiliar (inline ou separado)

- Funcao utilitaria para gerar dias do calendario (incluindo dias do mes anterior/posterior para completar a grid)
- Funcao para verificar se uma data esta dentro do range de um evento

### 3. Atualizar `src/App.tsx`

- Importar e adicionar rota `/calendario` com componente `Calendario`

### 4. Atualizar `src/components/layout/AppSidebar.tsx`

- Adicionar item de navegacao "Calendario" com icone `CalendarDays` do lucide-react, posicionado apos "Projetos"

### 5. Estilos e interacao

- Celulas do dia com min-height para acomodar eventos
- Dia atual destacado com borda/fundo azul
- Eventos com cores:
  - Projeto: `bg-blue-100 text-blue-800 border-l-2 border-blue-500`
  - Etapa no prazo: `bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500`
  - Etapa atrasada: `bg-red-100 text-red-800 border-l-2 border-red-500`
- Hover com tooltip mostrando nome completo do projeto/etapa
- Header com botoes "Anterior", "Hoje", "Proximo" e titulo "Mes Ano"

### 6. Nenhuma alteracao de banco necessaria

Todos os dados necessarios (projetos com datas e responsavel, etapas com datas e responsavel) ja existem nas tabelas. As RLS policies existentes ja filtram corretamente por area/responsavel.

