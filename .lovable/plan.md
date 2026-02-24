

# Remover Linha do Tempo do Dashboard

## Resumo

Remover completamente o componente "Linha do Tempo Estratégica" da pagina Dashboard, incluindo a constante `YEARS` e o import do icone `TrendingUp` (caso nao seja usado em outro lugar).

## Detalhes Tecnicos

### Arquivo modificado: `src/pages/Dashboard.tsx`

1. Remover a constante `YEARS` (linhas 40-45)
2. Remover o Card inteiro da "Linha do Tempo Estratégica" (o bloco com `TrendingUp`)
3. Remover o import de `TrendingUp` e `Badge` caso nao sejam usados em outro trecho do arquivo

Nenhuma alteracao no banco de dados. Apenas remocao de codigo estatico do frontend.

