
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('coordenacao', 'lider_area');

-- Enum for project status
CREATE TYPE public.project_status AS ENUM ('nao_iniciado', 'em_andamento', 'concluido', 'atrasado', 'cancelado');

-- Enum for proposal status
CREATE TYPE public.proposal_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Enum for project health
CREATE TYPE public.project_health AS ENUM ('no_prazo', 'atencao', 'atrasado');

-- Areas estratégicas
CREATE TABLE public.areas_estrategicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  area_id UUID REFERENCES public.areas_estrategicas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table as required)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Objetivos estratégicos
CREATE TABLE public.objetivos_estrategicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  ano INTEGER NOT NULL CHECK (ano >= 2026 AND ano <= 2029),
  tema_anual TEXT,
  area_id UUID REFERENCES public.areas_estrategicas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alvos/KPIs do PE
CREATE TABLE public.alvos_pe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objetivo_id UUID NOT NULL REFERENCES public.objetivos_estrategicos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  meta TEXT,
  indicador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projetos
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  area_id UUID REFERENCES public.areas_estrategicas(id),
  objetivo_id UUID REFERENCES public.objetivos_estrategicos(id),
  responsavel_id UUID REFERENCES public.profiles(id),
  status project_status NOT NULL DEFAULT 'nao_iniciado',
  saude project_health DEFAULT 'no_prazo',
  data_inicio DATE,
  data_fim DATE,
  orcamento_previsto NUMERIC(15,2) DEFAULT 0,
  valor_gasto NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Etapas do projeto
CREATE TABLE public.etapas_projeto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status project_status NOT NULL DEFAULT 'nao_iniciado',
  data_inicio DATE,
  data_fim DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários (em projetos ou etapas)
CREATE TABLE public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa_id UUID REFERENCES public.etapas_projeto(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id),
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (projeto_id IS NOT NULL OR etapa_id IS NOT NULL)
);

-- Propostas de projeto
CREATE TABLE public.propostas_projeto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  objetivo_id UUID REFERENCES public.objetivos_estrategicos(id),
  area_id UUID REFERENCES public.areas_estrategicas(id),
  proponente_id UUID NOT NULL REFERENCES public.profiles(id),
  estimativa_prazo TEXT,
  estimativa_orcamento NUMERIC(15,2),
  entregas_esperadas TEXT,
  status proposal_status NOT NULL DEFAULT 'pendente',
  comentario_aprovacao TEXT,
  aprovado_por UUID REFERENCES public.profiles(id),
  projeto_gerado_id UUID REFERENCES public.projetos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dados financeiros (importações CSV)
CREATE TABLE public.dados_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  descricao TEXT,
  valor NUMERIC(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('orcado', 'gasto')),
  data_referencia DATE,
  fonte TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diagnóstico situacional (referência consultável)
CREATE TABLE public.diagnostico_situacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  indicador TEXT NOT NULL,
  valor TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas_estrategicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_etapas_updated_at BEFORE UPDATE ON public.etapas_projeto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON public.propostas_projeto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user area_id
CREATE OR REPLACE FUNCTION public.get_user_area_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area_id FROM public.profiles WHERE id = _user_id
$$;

-- Helper: check if user is in same area as a project
CREATE OR REPLACE FUNCTION public.user_in_project_area(_user_id UUID, _projeto_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projetos p
    JOIN public.profiles pr ON pr.id = _user_id
    WHERE p.id = _projeto_id AND p.area_id = pr.area_id
  )
$$;

-- ===================== RLS =====================

-- Enable RLS on all tables
ALTER TABLE public.areas_estrategicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objetivos_estrategicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alvos_pe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico_situacional ENABLE ROW LEVEL SECURITY;

-- user_roles: only readable by the user themselves, managed by coordenacao
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Coordenacao can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Coordenacao can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Coordenacao can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- areas_estrategicas: readable by all authenticated
CREATE POLICY "Authenticated can read areas" ON public.areas_estrategicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordenacao can manage areas" ON public.areas_estrategicas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- objetivos_estrategicos: readable by all authenticated
CREATE POLICY "Authenticated can read objetivos" ON public.objetivos_estrategicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordenacao can manage objetivos" ON public.objetivos_estrategicos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- alvos_pe: readable by all authenticated
CREATE POLICY "Authenticated can read alvos" ON public.alvos_pe FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordenacao can manage alvos" ON public.alvos_pe FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- projetos: coordenacao sees all, lider sees own area
CREATE POLICY "Coordenacao can do all on projetos" ON public.projetos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));
CREATE POLICY "Users can read own area projetos" ON public.projetos FOR SELECT TO authenticated USING (
  area_id = public.get_user_area_id(auth.uid()) OR responsavel_id = auth.uid()
);
CREATE POLICY "Lider can insert projetos" ON public.projetos FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'lider_area') AND area_id = public.get_user_area_id(auth.uid())
);
CREATE POLICY "Lider can update own area projetos" ON public.projetos FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'lider_area') AND (area_id = public.get_user_area_id(auth.uid()) OR responsavel_id = auth.uid())
);

-- etapas_projeto: follow project access
CREATE POLICY "Coordenacao can do all on etapas" ON public.etapas_projeto FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));
CREATE POLICY "Users can read own area etapas" ON public.etapas_projeto FOR SELECT TO authenticated USING (
  public.user_in_project_area(auth.uid(), projeto_id)
);
CREATE POLICY "Lider can insert etapas" ON public.etapas_projeto FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'lider_area') AND public.user_in_project_area(auth.uid(), projeto_id)
);
CREATE POLICY "Lider can update own area etapas" ON public.etapas_projeto FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'lider_area') AND public.user_in_project_area(auth.uid(), projeto_id)
);

-- comentarios: follow parent access
CREATE POLICY "Coordenacao can do all on comentarios" ON public.comentarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));
CREATE POLICY "Users can read comentarios" ON public.comentarios FOR SELECT TO authenticated USING (
  (projeto_id IS NOT NULL AND public.user_in_project_area(auth.uid(), projeto_id))
  OR (etapa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.etapas_projeto e WHERE e.id = etapa_id AND public.user_in_project_area(auth.uid(), e.projeto_id)
  ))
);
CREATE POLICY "Authenticated can insert comentarios" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Users can update own comentarios" ON public.comentarios FOR UPDATE TO authenticated USING (autor_id = auth.uid());

-- propostas_projeto
CREATE POLICY "Coordenacao can do all on propostas" ON public.propostas_projeto FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));
CREATE POLICY "Users can read own propostas" ON public.propostas_projeto FOR SELECT TO authenticated USING (
  proponente_id = auth.uid() OR area_id = public.get_user_area_id(auth.uid())
);
CREATE POLICY "Lider can insert propostas" ON public.propostas_projeto FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'lider_area') AND proponente_id = auth.uid()
);

-- dados_financeiros: only coordenacao
CREATE POLICY "Coordenacao can do all on financeiros" ON public.dados_financeiros FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- diagnostico_situacional: readable by all authenticated
CREATE POLICY "Authenticated can read diagnostico" ON public.diagnostico_situacional FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordenacao can manage diagnostico" ON public.diagnostico_situacional FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coordenacao'));

-- Indexes for performance
CREATE INDEX idx_projetos_area ON public.projetos(area_id);
CREATE INDEX idx_projetos_responsavel ON public.projetos(responsavel_id);
CREATE INDEX idx_projetos_status ON public.projetos(status);
CREATE INDEX idx_etapas_projeto ON public.etapas_projeto(projeto_id);
CREATE INDEX idx_comentarios_projeto ON public.comentarios(projeto_id);
CREATE INDEX idx_propostas_area ON public.propostas_projeto(area_id);
CREATE INDEX idx_dados_financeiros_projeto ON public.dados_financeiros(projeto_id);
CREATE INDEX idx_objetivos_ano ON public.objetivos_estrategicos(ano);
