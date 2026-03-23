

## Plano: Implementar Múltiplos Responsáveis + Atualizar Dados da Planilha

### Parte 1: Criar tabela `projeto_responsaveis` (Migration)

Criar a tabela de junção conforme plano já aprovado anteriormente:

```sql
CREATE TABLE public.projeto_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contato_externo_id uuid REFERENCES contatos_externos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_one_responsavel CHECK (
    (profile_id IS NOT NULL AND contato_externo_id IS NULL) OR
    (profile_id IS NULL AND contato_externo_id IS NOT NULL)
  ),
  UNIQUE (projeto_id, profile_id),
  UNIQUE (projeto_id, contato_externo_id)
);
```

Com RLS policies, migração dos dados existentes e inserção dos dados da planilha.

### Parte 2: Inserir responsáveis da planilha

Usando os IDs já mapeados:

| Responsável na planilha | Contato Externo ID |
|---|---|
| Pr. Nélio Paiva | `220501fa-...` (Nélio Paiva) |
| Keila | `41686253-...` (Keila Leal) |
| Wesley | `1240c651-...` (Wesley Ramos) |
| Marcelo | `43022b5e-...` (Marcelo Heredia) |
| Filipe Carmet | `2f5e40c8-...` |
| Lorena Andrade | `1dbed532-...` |
| Jéssica Salviano | `69003a47-...` |
| Mariane Gaia | `314d24eb-...` |
| Pedro Fernandes | `339c64c2-...` |
| Renata | `57d55ac2-...` (Renata Martins) |
| Marcos Paulo | `d4633b45-...` (Marcos Paulo Almeida) |
| Eliza Santos | `37d4dbfc-...` |
| Eduardo Gnisci | `bad43b73-...` |
| Juliana Leão | `71cb108c-...` |
| Juninho | `e97e40b4-...` |
| Davi Sicon | `3d64f278-...` (David Sicon) |

Para projetos com "Wesley e Marcelo", ambos serão adicionados como responsáveis (agora possível com a nova tabela).

### Parte 3: Atualizar UI

**`ProjetoDetalhe.tsx`**: Substituir combobox único por lista de chips com avatar + nome + botão X para remover, e botão "+" para adicionar. Carregar de `projeto_responsaveis` com joins em `profiles` e `contatos_externos`.

**`Projetos.tsx`**: Atualizar cards para exibir múltiplos nomes e filtro de responsável para consultar a nova tabela.

### Parte 4: Script de dados

Executar script SQL/insert para popular `projeto_responsaveis` com os 67 projetos da planilha, mapeando cada nome de projeto ao ID correto no banco. Projetos com "A definir" serão ignorados.

### Resumo de arquivos alterados
- **Migration SQL**: criar tabela + RLS + migração de dados existentes
- **Script de dados**: inserir responsáveis da planilha na nova tabela
- **`src/pages/ProjetoDetalhe.tsx`**: UI de chips para múltiplos responsáveis
- **`src/pages/Projetos.tsx`**: exibição e filtro de múltiplos responsáveis

