

## Plano: Melhorar suavidade do scroll em todo o sistema

### Problema
O scroll nas páginas "pula" em vez de rolar suavemente.

### Solução

**1. `src/index.css`** — Adicionar `scroll-behavior: smooth` no `html` e melhorar o scroll do container principal com propriedades CSS:

```css
html {
  scroll-behavior: smooth;
}

/* Smooth scrolling for overflow containers */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

**2. `src/components/layout/AppLayout.tsx`** — Adicionar classe `scroll-smooth` ao container `main` com `overflow-y-auto`.

