

## Plano: Corrigir erro ao carregar anexos

### Causa raiz

A query no `loadAnexos` usa `profiles!anexos_projeto_enviado_por_fkey(nome)` para fazer join com a tabela `profiles`, mas **não existe** uma foreign key chamada `anexos_projeto_enviado_por_fkey` na tabela `anexos_projeto`. A coluna `enviado_por` existe mas não tem FK para `profiles`.

### Correção (2 passos)

| Passo | Ação |
|-------|------|
| 1. Migração SQL | Criar FK `anexos_projeto_enviado_por_fkey` ligando `anexos_projeto.enviado_por` → `profiles.id` |
| 2. Código | Nenhuma alteração necessária — o código já usa o nome correto da FK |

**SQL da migração:**
```sql
ALTER TABLE public.anexos_projeto
ADD CONSTRAINT anexos_projeto_enviado_por_fkey
FOREIGN KEY (enviado_por) REFERENCES public.profiles(id);
```

Isso permite que o PostgREST resolva o join `profiles!anexos_projeto_enviado_por_fkey(nome)` corretamente, eliminando o erro.

