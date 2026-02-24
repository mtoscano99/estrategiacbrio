

# Formulario de Novo Projeto Mais Completo

## Resumo

Reformular o formulario de criacao de projeto para incluir todos os campos relevantes, organizado em secoes claras com melhor experiencia de uso. O formulario passara a ter campos de datas (inicio e fim), selecao de responsavel, status inicial, e secao de entregas para todos os perfis.

## O que muda para o usuario

O formulario atual tem apenas 5-6 campos basicos. O novo formulario tera:

- **Secao 1 - Informacoes Gerais**: Titulo, descricao/justificativa, area estrategica, objetivo estrategico
- **Secao 2 - Planejamento**: Responsavel (dropdown com usuarios do sistema), data de inicio, data de fim, estimativa de prazo (texto livre)
- **Secao 3 - Financeiro**: Orcamento previsto (R$) com formatacao
- **Secao 4 - Entregas**: Entregas esperadas (textarea) -- visivel para todos os perfis
- Organizacao visual com separadores e subtitulos por secao
- Indicacao clara de campos obrigatorios
- Largura maxima maior (max-w-3xl) para melhor aproveitamento do espaco

## Detalhes Tecnicos

### Arquivo modificado: `src/pages/NovoProjeto.tsx`

Alteracoes:
1. Adicionar campos `data_inicio`, `data_fim` e `responsavel_id` ao estado do formulario
2. Carregar lista de `profiles` (id, nome) ao montar o componente para popular o dropdown de responsavel
3. Usar `type="date"` para os campos de data de inicio e fim
4. Incluir selecao de responsavel (Select com usuarios) -- coordenacao pode escolher qualquer usuario; lider fica fixo como ele mesmo
5. Tornar a secao "Entregas Esperadas" visivel para coordenacao tambem
6. Atualizar o insert de `projetos` para incluir `data_inicio`, `data_fim` e `responsavel_id` selecionado
7. Atualizar o insert de `propostas_projeto` para incluir as estimativas de data
8. Organizar campos em secoes com titulos visuais (usando Separator e subtitulos)
9. Aumentar container para `max-w-3xl`

### Nenhuma migracao necessaria

A tabela `projetos` ja possui `data_inicio`, `data_fim` e `responsavel_id`. A tabela `propostas_projeto` ja possui `estimativa_prazo`. Nao e necessario alterar o banco.

### Estrutura visual do formulario

```text
+------------------------------------------+
| Informacoes Gerais                       |
| [Titulo *]                               |
| [Descricao / Justificativa *]            |
| [Area Estrategica] [Objetivo Estrategico]|
|------------------------------------------|
| Planejamento                             |
| [Responsavel]     [Estimativa de Prazo]  |
| [Data Inicio]     [Data Fim]             |
|------------------------------------------|
| Financeiro                               |
| [Orcamento Previsto (R$)]                |
|------------------------------------------|
| Entregas                                 |
| [Entregas Esperadas]                     |
|------------------------------------------|
| [Cancelar]  [Criar Projeto / Enviar]     |
+------------------------------------------+
```

