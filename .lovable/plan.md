

# Cadastro dos Dados do Planejamento Estrategico no Banco de Dados

## Resumo
Inserir todos os dados extraidos do documento "Planejamento Estrategico CBRio 2026-2029" nas tabelas do banco de dados. As tabelas estao todas vazias e precisam ser populadas.

## Dados a serem inseridos

### 1. Areas Estrategicas (tabela `areas_estrategicas`)
7 areas identificadas no documento:
- Gestao e Operacoes
- Recursos Humanos (RH / Pessoas)
- Financeiro
- Ministerial
- Infraestrutura
- Comunicacao e Marketing
- Relacionamento e Captacao

### 2. Objetivos Estrategicos (tabela `objetivos_estrategicos`)
4 objetivos anuais, um por ano do quadrienio:

| Ano  | Tema Anual   | Titulo/Descricao                                                                |
|------|-------------|---------------------------------------------------------------------------------|
| 2026 | Unidade     | Consolidacao organizacional, finalizar pendencias, incremento 30% receita       |
| 2027 | Reavaliacao | Pausa estrategica, auditoria de efetividade, sustentabilidade CBS1 50%          |
| 2028 | Escalonamento| Expansao qualificada, sustentabilidade CBS1 80%, iniciar obras CBS2            |
| 2029 | Maturidade  | Consolidacao final, certificacao de gestao, plano 2030-2033, frequencia 3.000   |

### 3. Alvos do PE (tabela `alvos_pe`)
Alvos vinculados a cada objetivo estrategico, extraidos das tabelas de "Objetivos Especificos e Indicadores" do documento:

**2026 (6 alvos):**
- Concluir dimensionamento de quadro de pessoal (Meta: 100%)
- Finalizar todos os projetos satelites (Meta: 100%)
- Equilibrio operacional (Meta: deficit maximo 200mil)
- Frequencia presencial media semanal 2.300
- Preparar relatorio de licoes aprendidas 2024-2026 (Meta: 100%)
- Incremento 30% receita recorrente doadores (Meta: 80% contribuintes)

**2027 (5 alvos):**
- Auditoria completa de efetividade (Meta: 5 relatorios)
- Pesquisas com stakeholders (Meta: 4 pesquisas)
- Nivel de sustentabilidade CBS1 50%
- Refinar metodologias baseadas em aprendizados (Meta: 100%)
- Elaborar plano estrategico 2028-2029

**2028 (4 alvos):**
- Sustentabilidade do CBS1 nivel 80%
- Iniciar obras de infraestrutura CBS2
- Lancar 2 pontos satelites
- Campanha doacao recorrente 35% receita

**2029 (5 alvos):**
- Certificacao de qualidade de gestao (Meta: 85%+)
- Sustentabilidade CBS2 50% + reserva operacional 6 meses
- Lancar 3 novos programas ministeriais
- Frequencia presencial media 3.000
- Preparar plano estrategico 2030-2033 (Meta: 100%)

### 4. Diagnostico Situacional (tabela `diagnostico_situacional`)
Dados parciais de 2025 extraidos do documento, organizados por categoria:

**Frequencia:**
- Presencial 2025 (Jan-Set): 93.518
- Online 2025 (Jan-Set): 239.062

**Aceitacoes:**
- Presenciais 2025: 621
- Online 2025: 765

**Visitantes:**
- Presenciais 2025: 2.426
- Online 2025: 501

**Voluntariado:**
- Postos ocupados 2025 (parcial): ~8.581

**Financeiro:**
- Arrecadacao 2025 (Jan-Set): R$ 12.046.930,10
- Despesas 2025 (Jan-Out): R$ 12.297.631,63

## Detalhes Tecnicos

- Todas as insercoes serao feitas via ferramenta de insert (nao migrations), pois sao dados e nao alteracoes de schema.
- Os IDs serao gerados automaticamente (`gen_random_uuid()`).
- Os alvos precisam referenciar o `objetivo_id` correto, entao os objetivos serao inseridos primeiro.
- Nenhuma alteracao de codigo frontend sera necessaria -- as paginas de Planejamento Estrategico e Dashboard ja consultam essas tabelas.

