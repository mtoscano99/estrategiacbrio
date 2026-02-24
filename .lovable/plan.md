

## Implementar Valor Gasto por Etapa/Projeto

### Objetivo
Permitir registrar e visualizar o valor gasto em cada etapa do projeto, com totalização automática no nível do projeto.

### O que muda

**1. Banco de dados**
- Adicionar coluna `valor_gasto` (numeric, default 0) na tabela `etapas_projeto`
- Criar trigger que atualiza automaticamente o `valor_gasto` do projeto somando os valores de todas as suas etapas

**2. Interface - Etapa expandida (ProjetoDetalhe.tsx)**
- Adicionar campo editável "Valor Gasto (R$)" no grid de campos de cada etapa (ao lado de datas e responsavel)
- O campo salva via `onBlur`, igual aos demais campos existentes

**3. Interface - Etapa colapsada**
- Exibir o valor gasto ao lado das informações existentes (responsavel, data) quando houver valor > 0

**4. Interface - Card de Orçamento do projeto**
- O valor gasto já é exibido (linha 503). Com o trigger, ele será automaticamente atualizado quando etapas forem editadas

### Detalhes Técnicos

**Migracão SQL:**
```sql
-- Adicionar coluna
ALTER TABLE etapas_projeto ADD COLUMN valor_gasto numeric DEFAULT 0;

-- Trigger para somar valor_gasto das etapas no projeto
CREATE OR REPLACE FUNCTION sync_projeto_valor_gasto()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE projetos
  SET valor_gasto = (
    SELECT COALESCE(SUM(valor_gasto), 0)
    FROM etapas_projeto
    WHERE projeto_id = COALESCE(NEW.projeto_id, OLD.projeto_id)
  )
  WHERE id = COALESCE(NEW.projeto_id, OLD.projeto_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_projeto_valor_gasto
AFTER INSERT OR UPDATE OR DELETE ON etapas_projeto
FOR EACH ROW EXECUTE FUNCTION sync_projeto_valor_gasto();
```

**Componente SortableEtapaItem:**
- Novo campo `<Input type="number">` para valor_gasto no grid expandido (grid passa de 3 para 4 colunas em desktop)
- Na linha colapsada, exibir icone DollarSign + valor formatado quando > 0

**Formulario de nova etapa:**
- Adicionar campo opcional de valor gasto ao criar etapa

