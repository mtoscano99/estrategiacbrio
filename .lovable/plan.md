
# Integrar IA para Acompanhamento e Sugestoes nos Projetos

## Resumo

Adicionar um assistente de IA integrado ao sistema que oferece sugestoes contextuais em tres pontos principais: (1) analise e sugestoes para cada projeto, (2) sugestoes inteligentes para preenchimento da matriz SWOT, e (3) recomendacoes de acompanhamento para etapas. A IA usara o Lovable AI (modelo google/gemini-3-flash-preview) atraves de uma edge function, sem necessidade de chave de API adicional.

## Funcionalidades

### 1. Assistente IA na pagina do Projeto

Um botao "Sugestoes IA" no cabecalho da pagina de detalhe do projeto. Ao clicar, a IA recebe o contexto completo do projeto (nome, descricao, status, etapas, progresso, orcamento, itens SWOT) e retorna:

- Analise de riscos e pontos de atencao
- Sugestoes de proximos passos
- Recomendacoes de melhoria baseadas no status atual
- Alertas sobre atrasos ou gargalos

O resultado aparece em um dialog/card expansivel com a resposta formatada em markdown.

### 2. Sugestoes IA para Matriz SWOT

Um botao "Sugerir com IA" em cada quadrante da SWOT. Ao clicar, a IA recebe o contexto do projeto e os itens SWOT ja existentes, e sugere 3-5 novos itens para aquele quadrante especifico. O usuario pode aceitar individualmente cada sugestao (clicando para adicionar) ou descartar.

### 3. Sugestoes IA para Etapas

Um botao "Sugerir Etapas" no card de etapas. A IA analisa o projeto e as etapas existentes e sugere novas etapas que estejam faltando, com nomes e descricoes. O usuario pode aceitar cada sugestao individualmente.

## Detalhes Tecnicos

### Edge Function: `ai-project-assistant`

Uma unica edge function com diferentes "modos" de operacao:

```text
POST /ai-project-assistant
Body: { mode: "analise" | "swot" | "etapas", context: {...} }
```

- **mode "analise"**: Recebe dados completos do projeto, retorna analise em markdown
- **mode "swot"**: Recebe dados do projeto + tipo do quadrante + itens existentes, retorna array de sugestoes via tool calling
- **mode "etapas"**: Recebe dados do projeto + etapas existentes, retorna array de etapas sugeridas via tool calling

A funcao usa `LOVABLE_API_KEY` (ja configurada) para chamar `https://ai.gateway.lovable.dev/v1/chat/completions` com o modelo `google/gemini-3-flash-preview`.

Para os modos "swot" e "etapas", sera usado tool calling para extrair output estruturado (array de sugestoes). Para o modo "analise", sera usado streaming SSE para exibir a resposta token a token.

### Arquivos a criar

- `supabase/functions/ai-project-assistant/index.ts` -- Edge function com 3 modos

### Arquivos a modificar

- `src/pages/ProjetoDetalhe.tsx` -- Adicionar botao "Sugestoes IA" no cabecalho, dialog com resultado streaming, botao "Sugerir Etapas" no card de etapas
- `src/components/projetos/SWOTMatrix.tsx` -- Adicionar botao "Sugerir com IA" por quadrante, lista de sugestoes com botao aceitar/descartar
- `supabase/config.toml` -- Registrar a nova edge function com `verify_jwt = false`

### Componentes de UI

- Dialog de analise IA com streaming de markdown (usando `react-markdown` -- sera necessario instalar)
- Lista de sugestoes SWOT com botoes "Adicionar" / "Descartar" por item
- Lista de sugestoes de etapas com botoes "Adicionar" / "Descartar" por item
- Indicador de loading (spinner) durante a chamada da IA
- Icone de "Sparkles" (lucide) para identificar funcionalidades de IA

### Fluxo do usuario

1. Abre um projeto
2. Clica em "Sugestoes IA" no topo -- ve uma analise completa do projeto com riscos, recomendacoes e proximos passos
3. Na SWOT, clica "Sugerir" em um quadrante -- ve 3-5 sugestoes, clica para adicionar as que quiser
4. Nas etapas, clica "Sugerir Etapas" -- ve sugestoes de etapas faltantes, clica para adicionar

### Seguranca

- A edge function valida o JWT do usuario (autenticacao obrigatoria)
- `LOVABLE_API_KEY` nunca e exposta no frontend
- O prompt do sistema e definido apenas no backend, nao no cliente
- Erros 429 (rate limit) e 402 (creditos) sao tratados e exibidos como toast no frontend
