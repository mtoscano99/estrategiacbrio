

# Reestruturar o Sistema e Criar Projetos a partir do Documento

## Resumo

O sistema ja possui toda a infraestrutura de gestao de projetos (tabela `projetos`, etapas, SWOT, KPIs, comentarios). O que falta e **popular o banco com os projetos reais** extraidos do planejamento estrategico da CBRio, e fazer pequenos ajustes no Dashboard para refletir melhor um sistema de gestao de projetos.

Cada "alvo" do planejamento estrategico sera convertido em um projeto concreto, vinculado ao seu objetivo estrategico e a area estrategica mais adequada.

## Projetos que serao criados (20 projetos)

### Ano 2026 -- Unidade (6 projetos)

| Projeto | Area | Meta/Indicador |
|---------|------|----------------|
| Dimensionamento de Quadro de Pessoal | Recursos Humanos | 100% conclusao |
| Finalizacao dos Projetos Satelites | Gestao e Operacoes | 100% conclusao |
| Equilibrio Operacional Financeiro | Financeiro | Deficit max R$ 200.000 |
| Incremento de Frequencia Presencial (2.300) | Ministerial | Media semanal 2.300 |
| Relatorio de Licoes Aprendidas 2024-2026 | Gestao e Operacoes | 100% conclusao |
| Campanha Receita Recorrente Doadores (+30%) | Relacionamento e Captacao | 80% contribuintes |

### Ano 2027 -- Reavaliacao (5 projetos)

| Projeto | Area | Meta/Indicador |
|---------|------|----------------|
| Auditoria de Efetividade | Gestao e Operacoes | 5 relatorios |
| Pesquisas com Stakeholders | Comunicacao e Marketing | 4 pesquisas |
| Sustentabilidade CBS1 - Nivel 50% | Financeiro | 50% |
| Refinamento de Metodologias | Gestao e Operacoes | 100% conclusao |
| Plano Estrategico 2028-2029 | Gestao e Operacoes | Documento finalizado |

### Ano 2028 -- Escalonamento (4 projetos)

| Projeto | Area | Meta/Indicador |
|---------|------|----------------|
| Sustentabilidade CBS1 - Nivel 80% | Financeiro | 80% |
| Obras de Infraestrutura CBS2 | Infraestrutura | Inicio confirmado |
| Lancamento de 2 Pontos Satelites | Ministerial | 2 pontos |
| Campanha Doacao Recorrente (35% receita) | Relacionamento e Captacao | 35% |

### Ano 2029 -- Maturidade (5 projetos)

| Projeto | Area | Meta/Indicador |
|---------|------|----------------|
| Certificacao de Qualidade de Gestao | Gestao e Operacoes | Score 85%+ |
| Sustentabilidade CBS2 50% + Reserva 6 Meses | Financeiro | 50% + 6 meses |
| Lancamento de 3 Programas Ministeriais | Ministerial | 3 programas |
| Frequencia Presencial Media 3.000 | Ministerial | Media semanal 3.000 |
| Plano Estrategico 2030-2033 | Gestao e Operacoes | 100% conclusao |

## Ajustes no Dashboard

Remover a mensagem "Nenhum projeto cadastrado" e garantir que os graficos carreguem com os novos dados. Ajustar titulo para "Gestao de Projetos" no cabecalho.

## Detalhes Tecnicos

### Insercao de dados (via ferramenta de insert, nao migracao)

Serao 20 comandos `INSERT` na tabela `projetos`, cada um com:
- `nome`: titulo descritivo do projeto
- `descricao`: descricao do alvo + meta + indicador
- `area_id`: UUID da area estrategica correspondente
- `objetivo_id`: UUID do objetivo estrategico do ano
- `status`: `nao_iniciado` (projetos 2027-2029) ou `em_andamento` (projetos 2026)
- `data_inicio`: 01/01 do ano correspondente
- `data_fim`: 31/12 do ano correspondente
- `orcamento_previsto`: 0 (sera definido depois pela coordenacao)

### Arquivos modificados

- `src/pages/Dashboard.tsx` -- Ajuste no titulo principal de "Dashboard Estrategico" para "Gestao de Projetos CBRio" e garantir que os graficos funcionem com os dados populados

### Nenhuma mudanca de schema necessaria

A tabela `projetos` ja possui todas as colunas necessarias. Nao ha necessidade de migracao SQL.
