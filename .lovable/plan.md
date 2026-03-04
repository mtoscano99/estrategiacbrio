

## Plano: Corrigir erro de upload com caracteres especiais no nome do arquivo

O erro "Invalid key" ocorre porque o Supabase Storage não aceita caracteres especiais (acentos como `ã`, `ç`) no path do arquivo. O nome `67_Capacitação_Ministros_Louvor.docx` contém `ã` e `ç`.

### Correção

No arquivo `src/components/projetos/AnexosProjeto.tsx`, linha 76, sanitizar o nome do arquivo no `storagePath` removendo acentos e caracteres especiais, mantendo o nome original no registro do banco.

```
// Antes
const storagePath = `${projetoId}/${uid}-${file.name}`;

// Depois - normalizar removendo acentos
const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
const storagePath = `${projetoId}/${uid}-${safeName}`;
```

O `nome_arquivo` salvo no banco continua sendo `file.name` original (com acentos), apenas o path do storage é sanitizado.

| Arquivo | Ação |
|---------|------|
| `src/components/projetos/AnexosProjeto.tsx` | Sanitizar nome do arquivo no storage path (linha 76) |

