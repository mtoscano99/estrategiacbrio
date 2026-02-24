

# Sistema de Gestão de Projetos Estratégicos – CBRio

## Visão Geral
Sistema web completo para a Coordenação de Gestão Estratégica da CBRio, permitindo o acompanhamento macro e micro de todos os projetos do quadriênio 2026-2029. O sistema será alimentado com os dados do Planejamento Estratégico existente e permitirá que líderes de área proponham novos projetos, com fluxo de aprovação pela coordenação.

**Design**: Visual corporativo e limpo, tons neutros com destaque em azul, tipografia clara e profissional.

---

## Funcionalidades

### 1. Autenticação e Controle de Acesso
- Login com e-mail e senha via Supabase Auth
- Dois perfis de acesso: **Coordenação** (visão completa + aprovações) e **Líder de Área** (visão da sua área + proposição de projetos)
- Cada usuário vinculado a uma área (Gestão, RH, Financeiro, Ministerial, Infraestrutura, Comunicação, Relacionamento, etc.)

### 2. Dashboard Estratégico (Visão Macro)
- Painel inicial com visão geral do quadriênio 2026-2029 baseado no documento do PE
- **Indicadores-chave (KPIs)** em cards: total de projetos, projetos em andamento, atrasados, concluídos, orçamento total vs. gasto
- **Linha do tempo dos Objetivos Estratégicos** por ano (Unidade 2026 → Reavaliação 2027 → Escalonamento 2028 → Maturidade 2029)
- Gráficos de progresso por área estratégica e por ano
- Filtros por ano, área, status e responsável

### 3. Gestão de Projetos (Visão Micro)
- Cadastro completo de projetos com: nome, descrição, área estratégica, objetivo estratégico vinculado, responsável, datas de início/término, orçamento previsto
- **Etapas/marcos** dentro de cada projeto com status (não iniciado, em andamento, concluído, atrasado)
- **Cronograma visual** tipo Gantt simplificado por projeto
- Acompanhamento financeiro: valor orçado vs. valor gasto (com inserção manual ou importação CSV)
- Indicador de saúde do projeto (no prazo, atenção, atrasado) calculado automaticamente
- Histórico de atualizações e comentários em cada projeto

### 4. Formulário de Proposição de Projetos
- Formulário estruturado para líderes de área proporem novos projetos
- Campos: título, justificativa, objetivo estratégico vinculado, área responsável, estimativa de prazo, estimativa de orçamento, entregas esperadas
- Fluxo de aprovação: Líder submete → Coordenação recebe notificação → Aprova/Rejeita com comentário
- Projetos aprovados entram automaticamente no portfólio de gestão

### 5. Base de Dados do Planejamento Estratégico
- Toda a estrutura do PE pré-cadastrada: Macro Eixo, Objetivos Estratégicos por ano, Alvos, KPIs, Metas
- As planilhas de ação de 2026 a 2029 do documento já cadastradas como projetos iniciais
- Áreas estratégicas, responsáveis e indicadores conforme o documento
- Dados do diagnóstico situacional (frequência, financeiro, voluntariado) como referência consultável

### 6. Relatórios Padronizados
- Geração de relatório em PDF de qualquer projeto selecionado contendo:
  - Dados gerais do projeto (nome, área, responsável, objetivo vinculado)
  - Cronograma com etapas e status
  - Financeiro: valor orçado vs. gasto (com gráfico)
  - Lista de responsáveis
  - Progresso das etapas/entregas
  - Observações e histórico
- Relatório consolidado por área ou por ano
- Exportação em PDF

### 7. Importação de Dados Financeiros
- Upload de arquivos CSV com dados financeiros
- Mapeamento de colunas e vinculação ao projeto correto
- Histórico de importações

---

## Estrutura de Páginas
1. **Login** – Autenticação
2. **Dashboard** – Visão macro do quadriênio
3. **Projetos** – Lista e gestão de todos os projetos
4. **Projeto (detalhe)** – Visão micro com cronograma, financeiro, etapas
5. **Novo Projeto** – Formulário de proposição
6. **Aprovações** – Fila de projetos pendentes (apenas coordenação)
7. **Planejamento Estratégico** – Consulta ao PE (objetivos, metas, KPIs)
8. **Relatórios** – Geração e download de relatórios

## Tecnologia
- **Frontend**: React + Tailwind CSS + shadcn/ui (já configurado)
- **Backend**: Supabase (banco de dados PostgreSQL, autenticação, RLS)
- **Gráficos**: Recharts (já instalado)
- **PDF**: Geração de relatórios no navegador

