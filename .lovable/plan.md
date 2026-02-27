

## Problema: Relatório não reflete dados reais do projeto

O relatório calcula progresso **apenas** contando etapas com status "concluído" (linha 108). Etapas "em andamento" são ignoradas no cálculo, fazendo parecer que nada foi executado. Além disso, o relatório não mostra dados completos do projeto.

### Correções

**Arquivo: `src/pages/Relatorios.tsx`**

1. **Corrigir cálculo de progresso** — Considerar etapas "em_andamento" como progresso parcial (50%) e "concluido" como 100%, em vez de contar apenas concluídas
   - Nova fórmula: `(concluidas * 100 + emAndamento * 50) / totalEtapas`
   - Exibir contagem detalhada: "X concluídas, Y em andamento, Z não iniciadas"

2. **Adicionar resumo de status das etapas** — Painel visual com contadores por status (não iniciado, em andamento, concluído, atrasado) com ícones e cores

3. **Garantir que a query de etapas retorna dados** — A RLS de `profiles` bloqueia leitura de perfis alheios para líderes de área. A query de etapas com join em profiles pode falhar silenciosamente. Trocar o join por busca separada ou usar view

4. **Adicionar seção de descrição das etapas** — Incluir coluna de descrição na tabela de cronograma quando disponível

### Arquivos modificados
- `src/pages/Relatorios.tsx` — Cálculo de progresso, painel de status, robustez da query

