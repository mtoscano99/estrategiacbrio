

## Plano: Selecionar projetos e mover para uma pasta/categoria

### Resumo
Adicionar modo de seleção na lista de projetos: o usuário marca checkboxes nos projetos desejados, depois escolhe a pasta de destino em uma barra de ações que aparece no topo. Ao confirmar, os projetos selecionados têm seu `categoria_id` atualizado em lote.

### Implementação em `src/pages/Projetos.tsx`

**Novos estados:**
- `selectionMode: boolean` — ativa/desativa checkboxes nos cards
- `selectedIds: Set<string>` — IDs dos projetos marcados
- `moveTarget: string | null` — categoria destino escolhida no select

**UI — Barra de seleção:**
- Botão "Selecionar" ao lado dos botões existentes (Categorias, Importar, Novo Projeto)
- Quando ativo, cada card de projeto ganha um checkbox à esquerda (sem navegar ao clicar no checkbox)
- Barra flutuante no topo (ou inline) aparece com: contagem de selecionados, Select de categoria destino (incluindo "Sem Categoria"), botão "Mover", botão "Cancelar"

**Ação de mover:**
- `supabase.from("projetos").update({ categoria_id: target }).in("id", [...selectedIds])`
- Toast de sucesso, limpa seleção, recarrega dados

**Detalhes:**
- O checkbox no card precisa usar `e.preventDefault()` e `e.stopPropagation()` para não navegar ao projeto
- Apenas coordenação vê o botão de selecionar (consistente com permissões existentes)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Projetos.tsx` | Adicionar modo seleção, barra de ações, lógica de mover em lote |

