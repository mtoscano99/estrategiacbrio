

## Upload de Anexos e Documentos nos Projetos

### Resumo
Adicionar uma secao de anexos na pagina de detalhe do projeto, permitindo upload, listagem e exclusao de documentos (PDF, imagens, planilhas, etc.) usando o storage do backend.

### Alteracoes necessarias

#### 1. Backend - Storage Bucket e Tabela de Metadados

**Criar bucket `project-attachments`** (publico para facilitar download):

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('project-attachments', 'project-attachments', true);
```

**Politicas RLS no bucket** para controlar acesso:
- SELECT: usuarios autenticados podem ler
- INSERT: coordenacao e lideres da area do projeto podem inserir
- DELETE: coordenacao e o proprio uploader podem excluir

**Criar tabela `anexos_projeto`** para metadados:

```text
anexos_projeto
- id (uuid, PK)
- projeto_id (uuid, FK -> projetos.id, NOT NULL)
- nome_arquivo (text, NOT NULL)
- tamanho (bigint)
- tipo_mime (text)
- storage_path (text, NOT NULL)
- enviado_por (uuid, NOT NULL)
- created_at (timestamptz, default now())
```

**Politicas RLS na tabela:**
- SELECT: coordenacao ve tudo; lideres veem anexos de projetos da sua area
- INSERT: usuarios autenticados podem inserir (com `enviado_por = auth.uid()`)
- DELETE: coordenacao pode excluir qualquer um; usuario pode excluir os proprios

**ON DELETE CASCADE** no FK de `projeto_id` para limpar anexos ao excluir projeto.

#### 2. Frontend - Componente de Anexos

**Novo componente: `src/components/projetos/AnexosProjeto.tsx`**

Recebe `projetoId` como prop e renderiza:

- Botao "Adicionar Anexo" que abre um input file (aceita multiplos arquivos)
- Lista de anexos existentes em formato de tabela compacta:
  - Icone baseado no tipo (PDF, imagem, planilha, generico)
  - Nome do arquivo (clicavel para download)
  - Tamanho formatado (KB/MB)
  - Quem enviou
  - Data de envio
  - Botao de excluir (visivel apenas para o uploader ou coordenacao)

**Logica de upload:**
- Faz upload para `project-attachments/{projeto_id}/{uuid}-{filename}`
- Insere registro na tabela `anexos_projeto`
- Limite de 20MB por arquivo (validacao client-side)
- Feedback via toast de sucesso/erro

**Logica de download:**
- Gera URL publica do storage para download direto

**Logica de exclusao:**
- Remove o arquivo do storage
- Remove o registro da tabela `anexos_projeto`

#### 3. Integracao na pagina ProjetoDetalhe

Adicionar o componente `<AnexosProjeto>` como um novo Card entre a descricao e a analise SWOT (ou apos os comentarios), com titulo "Anexos e Documentos" e icone `Paperclip`.

### Arquivos alterados/criados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar bucket, tabela `anexos_projeto`, politicas RLS |
| `src/components/projetos/AnexosProjeto.tsx` | Novo componente |
| `src/pages/ProjetoDetalhe.tsx` | Importar e renderizar `AnexosProjeto` |

