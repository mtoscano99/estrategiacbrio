

## Plano: Drag and Drop para Anexos de Projetos

### Resumo
Adicionar uma zona de drag and drop no componente `AnexosProjeto.tsx`. Quando o usuário arrastar arquivos sobre a área de anexos, uma zona visual destacada aparece. Ao soltar, os arquivos são enviados usando a mesma lógica de upload existente.

### Implementação em `src/components/projetos/AnexosProjeto.tsx`

**Novos estados:**
- `isDragging: boolean` — controla o destaque visual da drop zone

**Event handlers nativos (sem biblioteca extra):**
- `onDragOver`, `onDragEnter` → `setIsDragging(true)` + `e.preventDefault()`
- `onDragLeave` → `setIsDragging(false)`
- `onDrop` → extrai `e.dataTransfer.files`, chama a lógica de upload existente

**Refatoração:**
- Extrair lógica de upload de `handleUpload` para uma função `uploadFiles(files: File[])` reutilizável
- `handleUpload` (input change) e `handleDrop` ambos chamam `uploadFiles`

**UI da drop zone:**
- Quando `anexos.length === 0` e não está arrastando: mensagem "Arraste arquivos aqui ou clique em Adicionar Anexo"
- Quando `isDragging`: borda tracejada azul com ícone de upload e texto "Solte os arquivos aqui"
- A zona de drop cobre todo o `CardContent`

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/components/projetos/AnexosProjeto.tsx` | Adicionar drag and drop com estados e handlers nativos do browser |

