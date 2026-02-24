

# Detalhamento de Etapas / Marcos

## Resumo

Transformar cada etapa de uma linha simples em um card expansivel com detalhes completos: descricao, datas (inicio/fim), responsavel, e status. Ao clicar em uma etapa, ela expande mostrando os detalhes e permitindo edicao inline.

## O que muda para o usuario

Cada etapa na lista passa a ser clicavel. Ao clicar, expande um painel abaixo com:

- **Descricao** da etapa (editavel)
- **Data de inicio** e **Data de fim** (editaveis)
- **Responsavel** (dropdown com usuarios do sistema)
- **Status** (ja existente, movido para dentro do painel expandido)
- Botao para **excluir** a etapa

O formulario de "Adicionar Etapa" tambem ganha os campos de descricao, datas e responsavel.

## Detalhes Tecnicos

### 1. Migracao no banco de dados

Adicionar coluna `responsavel_id` (uuid, nullable) na tabela `etapas_projeto`:

```sql
ALTER TABLE public.etapas_projeto ADD COLUMN responsavel_id uuid;
```

### 2. Modificar `src/pages/ProjetoDetalhe.tsx`

- Carregar lista de `profiles` para popular dropdown de responsavel nas etapas
- Adicionar estado `expandedEtapa` para controlar qual etapa esta expandida
- Usar o componente `Collapsible` (ja disponivel via radix) para expandir/recolher cada etapa
- Ao expandir, mostrar campos editaveis: descricao (Textarea), data_inicio e data_fim (inputs date), responsavel (Select com profiles)
- Criar funcao `updateEtapa` generica que atualiza qualquer campo da etapa no banco
- Expandir o formulario "Nova Etapa" para incluir descricao, datas e responsavel
- Adicionar botao de excluir etapa (com confirmacao)
- Alterar a query de etapas para incluir join com profiles: `etapas_projeto(*, profiles!etapas_projeto_responsavel_id_fkey(nome))`

### 3. Layout expandido de cada etapa

```text
+----------------------------------------------------+
| [1] Levantamento de Necessidades    [Em Andamento v]|
|    Clicavel para expandir                           |
|----------------------------------------------------|
| Descricao: [textarea editavel]                     |
| Responsavel: [dropdown]   Inicio: [date] Fim:[date]|
| [Excluir etapa]                                    |
+----------------------------------------------------+
```

### Nenhuma alteracao de RLS necessaria

As politicas existentes de `etapas_projeto` ja cobrem todas as colunas. A nova coluna `responsavel_id` sera protegida pelas mesmas regras.

