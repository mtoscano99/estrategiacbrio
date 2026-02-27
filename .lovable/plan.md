

## Plano: Importar Projeto a partir de Documento

### O que será feito

Criar funcionalidade que permite ao usuário fazer upload de um documento (DOCX/PDF) na página de Novo Projeto. A IA extrai automaticamente os dados do documento e preenche o projeto no sistema, incluindo nome, descrição, etapas, orçamento, datas e itens SWOT.

### Fluxo

1. Usuário clica em "Importar de Documento" na página `/novo-projeto`
2. Seleciona um arquivo DOCX ou PDF
3. O arquivo é enviado para uma edge function que:
   - Extrai o texto do documento
   - Envia o texto para a IA (Gemini) com prompt estruturado
   - IA retorna JSON com dados do projeto extraídos
4. O formulário é preenchido automaticamente com os dados extraídos
5. O projeto + etapas + SWOT são criados no banco ao submeter

### Implementação

**1. Nova edge function `import-project-doc`**
- Recebe o arquivo via FormData
- Extrai texto bruto do DOCX (parsing simples dos XML internos do .docx via JSZip no Deno) ou texto de PDF
- Envia para Lovable AI (Gemini) com tool calling para retornar JSON estruturado:
  ```json
  {
    "nome": "...",
    "descricao": "...",
    "data_inicio": "2026-03-01",
    "data_fim": "2026-05-31",
    "orcamento_previsto": 30000,
    "centro_custo": "...",
    "etapas": [
      { "nome": "...", "descricao": "...", "data_inicio": "...", "data_fim": "..." }
    ],
    "swot": {
      "forca": ["..."],
      "fraqueza": ["..."],
      "oportunidade": ["..."],
      "ameaca": ["..."]
    }
  }
  ```

**2. Atualizar `src/pages/NovoProjeto.tsx`**
- Adicionar botão "Importar de Documento" ao lado do título
- Input file hidden para DOCX/PDF
- Ao selecionar: chama a edge function, preenche o formulário
- Loading state durante processamento
- Após preenchimento, usuário revisa e confirma
- No submit (coordenação): criar projeto, depois inserir etapas e itens SWOT extraídos

**3. Config**
- Adicionar `[functions.import-project-doc]` com `verify_jwt = false` no config.toml

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/import-project-doc/index.ts` | **Novo** — Edge function de parsing + IA |
| `src/pages/NovoProjeto.tsx` | Botão importar, lógica de preenchimento e criação com etapas/SWOT |
| `supabase/config.toml` | Adicionar config da nova function |

