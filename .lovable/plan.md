

## Plano: Adicionar responsáveis externos (sem login no sistema)

### Problema atual
O campo "Responsável" em projetos e etapas só aceita usuários cadastrados (profiles). Não é possível atribuir alguém externo ao sistema.

### Solução
Criar uma tabela `contatos_externos` para armazenar pessoas que não possuem login, e permitir que o campo de responsável aceite tanto usuários do sistema quanto contatos externos.

### Implementação

**1. Nova tabela `contatos_externos`** (migration)
```sql
CREATE TABLE public.contatos_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  cargo text,
  organizacao text,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos_externos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler e inserir
CREATE POLICY "Authenticated can read contatos" ON public.contatos_externos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contatos" ON public.contatos_externos FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "Coordenacao can manage contatos" ON public.contatos_externos FOR ALL TO authenticated USING (has_role(auth.uid(), 'coordenacao'));
```

**2. Adicionar coluna `responsavel_externo_id` nas tabelas `projetos` e `etapas_projeto`**
```sql
ALTER TABLE public.projetos ADD COLUMN responsavel_externo_id uuid REFERENCES public.contatos_externos(id);
ALTER TABLE public.etapas_projeto ADD COLUMN responsavel_externo_id uuid REFERENCES public.contatos_externos(id);
```

**3. Atualizar `src/pages/NovoProjeto.tsx`**
- No seletor de responsável, adicionar opção "Adicionar pessoa externa..." no final da lista
- Ao selecionar, abrir um mini-dialog para preencher nome, email, cargo (opcional)
- Salvar o contato externo na tabela e definir `responsavel_externo_id` no formulário
- Exibir tanto profiles quanto contatos externos no dropdown

**4. Atualizar `src/pages/ProjetoDetalhe.tsx`**
- No seletor de responsável do projeto e das etapas, incluir contatos externos
- Ao exibir o nome do responsável, verificar ambas as colunas (`responsavel_id` e `responsavel_externo_id`)
- Adicionar opção de criar novo contato externo inline

**5. Atualizar componentes de exibição** (Relatorios, RelatorioFinanceiro, Calendario)
- Ao exibir nome do responsável, consultar também `contatos_externos` quando `responsavel_externo_id` estiver preenchido

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Nova tabela + colunas |
| `src/pages/NovoProjeto.tsx` | Seletor com opção de contato externo |
| `src/pages/ProjetoDetalhe.tsx` | Seletor e exibição com externos |
| `src/pages/Relatorios.tsx` | Exibir nome de externos |
| `src/pages/RelatorioFinanceiro.tsx` | Exibir nome de externos |

