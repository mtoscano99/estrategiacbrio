

## Plano: Adicionar filtro por Responsável na página de Projetos

### O que será feito

Adicionar um dropdown de filtro "Responsável" na barra de filtros da página de Projetos, ao lado dos filtros já existentes (Categoria, Área, Status, Centro de Custo).

### Detalhes técnicos

**Arquivo**: `src/pages/Projetos.tsx`

1. **Carregar lista de responsáveis**: No `loadData`, adicionar query para buscar `profiles` (id, nome) que são responsáveis de algum projeto. Alternativamente, extrair a lista única de responsáveis dos próprios projetos carregados.

2. **Novo estado de filtro**: Adicionar `filterResponsavel` (default `"all"`).

3. **Lógica de filtragem**: Adicionar condição `matchResponsavel` no `filtered` comparando `p.responsavel_id === filterResponsavel`.

4. **UI do filtro**: Adicionar um `<Select>` com opções extraídas dos `profiles.nome` presentes nos projetos (usando o join já existente `profiles!projetos_responsavel_id_fkey`), posicionado junto aos outros filtros.

5. **Incluir contatos externos**: Considerar também `responsavel_externo_id` — projetos com responsável externo também devem ser filtráveis. As opções do filtro agruparão ambos (internos e externos) com identificação visual.

