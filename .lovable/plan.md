

## Problema: Status do projeto não pode ser alterado

O Badge de status do projeto na página de detalhe é apenas visual (read-only). Não existe nenhum controle para o usuário alterar o status do projeto.

### Correção

**Arquivo: `src/pages/ProjetoDetalhe.tsx`**

Substituir o `<Badge>` estático de status do projeto (linhas 500-502) por um `<Select>` que permite alterar o status diretamente, salvando no banco ao selecionar:

1. Trocar o Badge por um Select com as opções de STATUS_LABELS (Não Iniciado, Em Andamento, Concluído, Atrasado, Cancelado)
2. Ao selecionar um novo status, fazer `supabase.from("projetos").update({ status }).eq("id", id)` e atualizar o estado local
3. Manter o estilo visual com cores diferentes por status (destructive para atrasado, default para outros)
4. Restringir edição apenas para coordenação (`isCoordination`) ou responsável do projeto

