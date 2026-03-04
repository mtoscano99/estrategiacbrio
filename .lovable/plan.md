

## Plano: Editar descrição do projeto

### O que muda

No arquivo `src/pages/ProjetoDetalhe.tsx`, o bloco de descrição (linhas 791-795) que hoje é estático será substituído por um campo editável inline:

- A descrição sempre aparece (mesmo vazia), com um `Textarea` que salva ao perder foco (`onBlur`)
- Ao alterar, faz `supabase.from("projetos").update({ descricao: value }).eq("id", id)` e atualiza o estado local
- Toast de confirmação ao salvar
- Placeholder "Adicionar descrição..." quando vazio (mesmo padrão usado nas etapas)
- Apenas usuários autorizados (coordenação ou líder da área) podem editar; outros veem texto estático

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/pages/ProjetoDetalhe.tsx` | Substituir bloco estático de descrição por Textarea editável com auto-save |

