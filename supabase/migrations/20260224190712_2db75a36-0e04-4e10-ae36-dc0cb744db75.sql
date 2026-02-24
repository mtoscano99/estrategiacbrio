
-- Fix projetos: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Coordenacao can do all on projetos" ON projetos;
DROP POLICY IF EXISTS "Users can read own area projetos" ON projetos;
DROP POLICY IF EXISTS "Lider can insert projetos" ON projetos;
DROP POLICY IF EXISTS "Lider can update own area projetos" ON projetos;

CREATE POLICY "Coordenacao can do all on projetos" ON projetos FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can read own area projetos" ON projetos FOR SELECT
  USING ((area_id = get_user_area_id(auth.uid())) OR (responsavel_id = auth.uid()));

CREATE POLICY "Lider can insert projetos" ON projetos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND area_id = get_user_area_id(auth.uid()));

CREATE POLICY "Lider can update own area projetos" ON projetos FOR UPDATE
  USING (has_role(auth.uid(), 'lider_area'::app_role) AND (area_id = get_user_area_id(auth.uid()) OR responsavel_id = auth.uid()));

-- Fix areas_estrategicas
DROP POLICY IF EXISTS "Authenticated can read areas" ON areas_estrategicas;
DROP POLICY IF EXISTS "Coordenacao can manage areas" ON areas_estrategicas;

CREATE POLICY "Authenticated can read areas" ON areas_estrategicas FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage areas" ON areas_estrategicas FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix objetivos_estrategicos
DROP POLICY IF EXISTS "Authenticated can read objetivos" ON objetivos_estrategicos;
DROP POLICY IF EXISTS "Coordenacao can manage objetivos" ON objetivos_estrategicos;

CREATE POLICY "Authenticated can read objetivos" ON objetivos_estrategicos FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage objetivos" ON objetivos_estrategicos FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix kpis
DROP POLICY IF EXISTS "Authenticated can read kpis" ON kpis;
DROP POLICY IF EXISTS "Coordenacao can manage kpis" ON kpis;

CREATE POLICY "Authenticated can read kpis" ON kpis FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage kpis" ON kpis FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix kpi_medicoes
DROP POLICY IF EXISTS "Authenticated can read medicoes" ON kpi_medicoes;
DROP POLICY IF EXISTS "Coordenacao can manage medicoes" ON kpi_medicoes;
DROP POLICY IF EXISTS "Lider can insert medicoes da sua area" ON kpi_medicoes;

CREATE POLICY "Authenticated can read medicoes" ON kpi_medicoes FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage medicoes" ON kpi_medicoes FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Lider can insert medicoes da sua area" ON kpi_medicoes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND registrado_por = auth.uid() AND EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_medicoes.kpi_id AND k.area_id = get_user_area_id(auth.uid())
  ));

-- Fix alvos_pe
DROP POLICY IF EXISTS "Authenticated can read alvos" ON alvos_pe;
DROP POLICY IF EXISTS "Coordenacao can manage alvos" ON alvos_pe;

CREATE POLICY "Authenticated can read alvos" ON alvos_pe FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage alvos" ON alvos_pe FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix diagnostico_situacional
DROP POLICY IF EXISTS "Authenticated can read diagnostico" ON diagnostico_situacional;
DROP POLICY IF EXISTS "Coordenacao can manage diagnostico" ON diagnostico_situacional;

CREATE POLICY "Authenticated can read diagnostico" ON diagnostico_situacional FOR SELECT
  USING (true);

CREATE POLICY "Coordenacao can manage diagnostico" ON diagnostico_situacional FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix comentarios
DROP POLICY IF EXISTS "Coordenacao can do all on comentarios" ON comentarios;
DROP POLICY IF EXISTS "Users can read comentarios" ON comentarios;
DROP POLICY IF EXISTS "Authenticated can insert comentarios" ON comentarios;
DROP POLICY IF EXISTS "Users can update own comentarios" ON comentarios;

CREATE POLICY "Coordenacao can do all on comentarios" ON comentarios FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can read comentarios" ON comentarios FOR SELECT
  USING (
    (projeto_id IS NOT NULL AND user_in_project_area(auth.uid(), projeto_id))
    OR (etapa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM etapas_projeto e WHERE e.id = comentarios.etapa_id AND user_in_project_area(auth.uid(), e.projeto_id)
    ))
  );

CREATE POLICY "Authenticated can insert comentarios" ON comentarios FOR INSERT
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "Users can update own comentarios" ON comentarios FOR UPDATE
  USING (autor_id = auth.uid());

-- Fix etapas_projeto
DROP POLICY IF EXISTS "Coordenacao can do all on etapas" ON etapas_projeto;
DROP POLICY IF EXISTS "Users can read own area etapas" ON etapas_projeto;
DROP POLICY IF EXISTS "Lider can insert etapas" ON etapas_projeto;
DROP POLICY IF EXISTS "Lider can update own area etapas" ON etapas_projeto;

CREATE POLICY "Coordenacao can do all on etapas" ON etapas_projeto FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can read own area etapas" ON etapas_projeto FOR SELECT
  USING (user_in_project_area(auth.uid(), projeto_id));

CREATE POLICY "Lider can insert etapas" ON etapas_projeto FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id));

CREATE POLICY "Lider can update own area etapas" ON etapas_projeto FOR UPDATE
  USING (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id));

-- Fix propostas_projeto
DROP POLICY IF EXISTS "Coordenacao can do all on propostas" ON propostas_projeto;
DROP POLICY IF EXISTS "Users can read own propostas" ON propostas_projeto;
DROP POLICY IF EXISTS "Lider can insert propostas" ON propostas_projeto;

CREATE POLICY "Coordenacao can do all on propostas" ON propostas_projeto FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can read own propostas" ON propostas_projeto FOR SELECT
  USING (proponente_id = auth.uid() OR area_id = get_user_area_id(auth.uid()));

CREATE POLICY "Lider can insert propostas" ON propostas_projeto FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND proponente_id = auth.uid());

-- Fix dados_financeiros
DROP POLICY IF EXISTS "Coordenacao can do all on financeiros" ON dados_financeiros;

CREATE POLICY "Coordenacao can do all on financeiros" ON dados_financeiros FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix profiles
DROP POLICY IF EXISTS "Coordenacao can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Coordenacao can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Coordenacao can read all profiles" ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Coordenacao can manage profiles" ON profiles FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "Coordenacao can manage roles" ON user_roles;

CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Coordenacao can manage roles" ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

-- Fix swot_items
DROP POLICY IF EXISTS "Coordenacao can manage swot items" ON swot_items;
DROP POLICY IF EXISTS "Users can read swot items" ON swot_items;
DROP POLICY IF EXISTS "Lider can insert swot items" ON swot_items;
DROP POLICY IF EXISTS "Lider can delete swot items" ON swot_items;

CREATE POLICY "Coordenacao can manage swot items" ON swot_items FOR ALL
  USING (has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Users can read swot items" ON swot_items FOR SELECT
  USING (has_role(auth.uid(), 'coordenacao'::app_role) OR user_in_project_area(auth.uid(), projeto_id));

CREATE POLICY "Lider can insert swot items" ON swot_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id) AND criado_por = auth.uid());

CREATE POLICY "Lider can delete swot items" ON swot_items FOR DELETE
  USING (has_role(auth.uid(), 'lider_area'::app_role) AND user_in_project_area(auth.uid(), projeto_id));
