

## Plano: Corrigir impressão PDF para mostrar apenas conteúdo do relatório

### Problema
A sidebar usa `<aside>` sem o atributo `data-sidebar`, então o seletor CSS `[data-sidebar]` no `@media print` não a esconde. O header da aplicação também pode não estar sendo ocultado corretamente.

### Correções

**1. `src/components/layout/AppLayout.tsx`** — Adicionar classes `print:hidden` na sidebar e no header:
- Wrapper da `<AppSidebar />` recebe `className="print:hidden"`
- `<header>` recebe `className="... print:hidden"`

**2. `src/index.css`** — Reforçar os seletores print para cobrir `aside` e garantir que apenas o conteúdo principal aparece:
- Adicionar `aside` ao seletor de ocultação
- Garantir que o container flex principal vira `display: block` no print

