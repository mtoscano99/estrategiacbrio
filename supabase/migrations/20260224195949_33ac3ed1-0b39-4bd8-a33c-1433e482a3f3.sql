
ALTER TABLE etapas_projeto ADD COLUMN valor_gasto numeric DEFAULT 0;

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
