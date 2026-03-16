

## Plano: Adicionar Responsável Macro na Página de Detalhe do Projeto

### O que será feito

Adicionar um campo editável de "Responsável" visível na página de detalhe do projeto, logo abaixo do título (no header), permitindo visualizar e alterar o responsável macro do projeto. Usará o componente `ResponsavelCombobox` já existente, que consolida usuários internos e contatos externos.

### Detalhes técnicos

**Arquivo**: `src/pages/ProjetoDetalhe.tsx`

1. **No header** (linhas ~583-647): Adicionar abaixo do nome do projeto e da área estratégica uma linha com o avatar e nome do responsável atual, clicável para editar via `ResponsavelCombobox`.

2. **Lógica de atualização**: Ao selecionar um novo responsável:
   - Se interno: `UPDATE projetos SET responsavel_id = X, responsavel_externo_id = null`
   - Se externo (`ext:ID`): `UPDATE projetos SET responsavel_externo_id = X, responsavel_id = null`
   - Se `__novo_externo__`: abrir o dialog `NovoContatoExternoDialog` (já existente na página)

3. **Exibição**: Mostrar avatar + nome do responsável atual ao lado do título. Se nenhum responsável, exibir botão "Atribuir responsável".

4. **Dados**: O join `profiles!projetos_responsavel_id_fkey(nome)` já está na query. Para exibir avatar e contato externo, usar os dados de `profiles` e `contatosExternos` já carregados no estado.

