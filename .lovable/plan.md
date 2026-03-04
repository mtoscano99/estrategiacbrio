

## Plano: Preview de imagens nos anexos + correção de exibição

### Problema 1: Arquivo não aparece após upload
O `loadAnexos` usa `as any` e ignora erros silenciosamente. Se o SELECT falhar por RLS ou outro motivo, `data` é `null` e nada muda. Vou adicionar tratamento de erro com log/toast para não engolir falhas.

### Problema 2: Preview de imagens
Quando o anexo for uma imagem (`tipo_mime` começa com `image/`), mostrar uma miniatura (thumbnail) na tabela ao lado do nome do arquivo, usando a URL pública do storage.

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/projetos/AnexosProjeto.tsx` | 1. Adicionar thumbnail para anexos de imagem na coluna "Arquivo" (usar `getPublicUrl` + tag `<img>` com tamanho fixo ~40x40px, object-cover, rounded) |
| `src/components/projetos/AnexosProjeto.tsx` | 2. Adicionar tratamento de erro no `loadAnexos` para exibir toast em caso de falha no SELECT |
| `src/components/projetos/AnexosProjeto.tsx` | 3. Adicionar modal/dialog de preview em tamanho maior ao clicar na miniatura da imagem |

### Detalhes técnicos

- **Thumbnail**: Para anexos com `tipo_mime?.startsWith("image/")`, gerar URL via `supabase.storage.from("project-attachments").getPublicUrl(anexo.storage_path)` e renderizar `<img>` de 40x40px com `object-cover` e `rounded`
- **Preview modal**: Dialog simples com a imagem em tamanho grande ao clicar no thumbnail
- **Error handling no loadAnexos**: Capturar `error` do retorno do Supabase e exibir `toast.error` quando não for null

