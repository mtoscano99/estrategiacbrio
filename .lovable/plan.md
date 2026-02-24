

# Matriz SWOT por Projeto

## Resumo

Adicionar a funcionalidade de criar e gerenciar uma Matriz SWOT (Forcas, Fraquezas, Oportunidades e Ameacas) para cada projeto do sistema. Cada projeto podera ter sua propria analise SWOT, com itens organizados nos 4 quadrantes classicos.

## O que sera construido

### 1. Nova tabela `swot_items`

Armazena os itens de cada quadrante SWOT vinculados a um projeto:

| Coluna     | Tipo      | Descricao                                        |
|------------|-----------|--------------------------------------------------|
| id         | uuid (PK) | Identificador unico                              |
| projeto_id | uuid (FK) | Referencia ao projeto                            |
| tipo       | text      | 'forca', 'fraqueza', 'oportunidade', 'ameaca'   |
| descricao  | text      | Texto descritivo do item                         |
| criado_por | uuid (FK) | Usuario que criou                                |
| created_at | timestamp | Data de criacao                                  |

### 2. Politicas de seguranca (RLS)

- Leitura: todos autenticados que tenham acesso ao projeto (mesma area ou coordenacao)
- Criacao/edicao/exclusao: coordenacao pode tudo; lideres podem gerenciar SWOT de projetos da sua area

### 3. Componente `SWOTMatrix` na pagina de detalhe do projeto

Uma visualizacao em grid 2x2 com os 4 quadrantes, cada um com cor distinta:

```text
+-----------------------------+-----------------------------+
|  FORCAS (verde)             |  FRAQUEZAS (vermelho)       |
|  - item 1                  |  - item 1                   |
|  - item 2                  |  - item 2                   |
|  [+ Adicionar]              |  [+ Adicionar]              |
+-----------------------------+-----------------------------+
|  OPORTUNIDADES (azul)       |  AMEACAS (amarelo)          |
|  - item 1                  |  - item 1                   |
|  - item 2                  |  - item 2                   |
|  [+ Adicionar]              |  [+ Adicionar]              |
+-----------------------------+-----------------------------+
```

Cada quadrante permite:
- Visualizar itens existentes
- Adicionar novo item (inline, sem modal)
- Excluir item (botao X ao lado)

### 4. Integracao com a pagina de detalhe do projeto

A Matriz SWOT sera adicionada como uma nova secao (Card) na pagina `/projetos/:id`, entre a descricao e as etapas.

## Detalhes Tecnicos

### Migracao SQL

Uma unica migracao criando:
- Tabela `swot_items` com foreign key para `projetos` (CASCADE on delete) e `profiles`
- RLS com leitura via `user_in_project_area` e coordenacao com acesso total
- Lideres podem inserir/atualizar/deletar itens de projetos da sua area
- Indice em `projeto_id` para performance

### Novos arquivos

- `src/components/projetos/SWOTMatrix.tsx` -- componente visual da matriz SWOT 2x2 com formulario inline para adicionar/remover itens

### Arquivos modificados

- `src/pages/ProjetoDetalhe.tsx` -- importar e renderizar o componente `SWOTMatrix` passando o `projeto_id`

### Bibliotecas utilizadas (ja instaladas)

- Componentes shadcn/ui existentes (Card, Input, Button, Badge)
- Lucide icons (Plus, X, Shield, AlertTriangle, TrendingUp, TrendingDown)

