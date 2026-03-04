

## Plano: Importar pessoas da planilha para contatos externos

O sistema já possui a tabela `contatos_externos` (nome, email, cargo, organizacao, etc.) que é usada nos seletores de responsável em projetos e etapas. A solução é importar os dados da planilha nessa tabela.

Como não consigo ler o arquivo XLSX diretamente, vou criar uma funcionalidade de importação no sistema.

### Alterações

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar dependência `xlsx` (SheetJS) para parsing de planilhas no cliente |
| `src/pages/Projetos.tsx` ou novo componente | Adicionar botão/dialog "Importar Pessoas" na área de gestão |
| Novo: `src/components/projetos/ImportarContatosDialog.tsx` | Dialog com upload de XLSX/CSV, preview da tabela extraída (nome, email), e botão para importar em lote na tabela `contatos_externos` |

### Fluxo

1. Usuário clica em "Importar Pessoas" (acessível da sidebar ou da página de projetos)
2. Faz upload do arquivo `.xlsx`
3. Sistema lê as colunas usando SheetJS, identifica colunas de nome e email
4. Mostra preview em tabela com checkbox para selecionar quais importar
5. Ao confirmar, insere em lote na tabela `contatos_externos` com `criado_por = auth.uid()`
6. Pessoas ficam disponíveis nos seletores de responsável

### Detalhes técnicos

- Parsing 100% client-side com `xlsx` (SheetJS), sem necessidade de edge function
- Detecção automática de colunas por header (nome/name, email/e-mail)
- Verificação de duplicatas por email antes de inserir
- Inserção em batch via `supabase.from("contatos_externos").insert([...])` 
- RLS já permite insert com `criado_por = auth.uid()`

