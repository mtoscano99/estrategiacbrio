# Plano: Expandir `CONTEXT.md` para uso em posts de LinkedIn

Reescrever o `CONTEXT.md` em uma versão mais rica e narrativa, otimizada para servir de base para posts no LinkedIn (storytelling técnico + dados concretos + ganchos de conteúdo).

## Objetivo
Transformar o documento atual (referência técnica seca) em um material que sirva como **fonte única de verdade narrativa** sobre o sistema, permitindo extrair facilmente:
- Posts de bastidores ("como construímos X")
- Posts técnicos ("arquitetura de roles sem privilege escalation")
- Posts de produto ("multi-responsáveis em projetos estratégicos")
- Posts de jornada ("de planilha Excel para sistema com IA")

## Nova estrutura proposta

### 1. Pitch de 1 parágrafo
Frase de elevator pitch + 3 bullets de valor (substitui posts genéricos do tipo "o que é o sistema").

### 2. O problema que o sistema resolve
- Cenário antes (planilhas, dispersão, falta de rastreabilidade)
- Dores específicas da coordenação vs. líderes de área
- Por que um SaaS pronto não servia

### 3. Visão de produto
- Personas (Coordenação, Líder de Área)
- Jornadas principais (criar projeto → etapas → KPIs → aprovação → relatório)
- Diferenciais (IA para ATAs, importação em massa, múltiplos responsáveis, SWOT integrado)

### 4. Arquitetura em camadas (com diagrama ASCII)
```
Browser (React SPA)
    │
    ▼
Lovable Cloud Edge (Auth + Postgres + Storage + Functions)
    │
    ▼
Lovable AI Gateway → Gemini-3-Flash
```
+ explicação de cada camada e por que foi escolhida.

### 5. Stack detalhada (com "por quê" de cada escolha)
Para cada tecnologia, incluir: **o que é**, **por que escolhemos**, **alternativa descartada**. Cobre:
- React 18 + Vite (vs. Next.js)
- TypeScript (segurança de tipos em domínio complexo)
- Tailwind + shadcn/ui (design system semântico)
- TanStack Query (cache server-state)
- React Router v6
- Supabase/Lovable Cloud (vs. backend próprio)
- Gemini-3-Flash via Lovable AI Gateway (vs. OpenAI direto)
- Vitest

### 6. Modelo de dados — deep dive
- Diagrama ER textual
- Cada tabela com: propósito, colunas-chave, relacionamentos, política RLS resumida
- Destaque para padrões de segurança:
  - `user_roles` separada (anti privilege escalation)
  - Funções `SECURITY DEFINER` (`has_role`, `user_in_project_area`)
  - GRANT explícito em todas as tabelas `public`
- Triggers de domínio (sync de valor gasto, criação automática de profile)

### 7. Autenticação e autorização — caso de estudo
- Fluxo completo Google OAuth + email/senha
- Como `AuthContext` lida com race conditions (defer DB calls, fallback timeout)
- Tela `/selecionar-perfil` como guard rail
- Lição aprendida: usuários Google sem role ficavam presos → solução

### 8. IA aplicada (gancho forte pra LinkedIn)
- Lovable AI Gateway: como funciona, por que evita gerenciar chave do Google
- Casos de uso reais no sistema:
  - **Processamento de ATAs** (`process-ata`): extrai decisões, responsáveis e prazos de texto livre
  - **Assistente de projetos** (`ai-project-assistant`): conversa contextual
  - **Importação de documentos** (`import-project-doc` e `import-projects-bulk`): cria projetos a partir de docs
- Custos e modelo de preço (Gemini-3-Flash)

### 9. Edge Functions — anatomia
Tabela com: nome, runtime (Deno), `verify_jwt`, entrada, saída, dependências.

### 10. Frontend — padrões de UI
- Sidebar colapsável + AppLayout
- Componentes reutilizáveis (`ResponsavelCombobox`, `SWOTMatrix`, `KPICard`)
- Geração de DOCX no client (`docxGenerator`)
- Calendário de etapas
- Sistema de notificações in-app

### 11. Storage e arquivos
- Buckets `avatars` e `project-attachments`
- Convenção de paths
- Políticas de acesso

### 12. Fluxo de desenvolvimento
- Build no Lovable (sem CI/CD manual)
- Migrations versionadas em `supabase/migrations/`
- Deploy automático de Edge Functions
- Preview vs. produção

### 13. Números do projeto (preencher conforme dados reais)
- N de tabelas, N de Edge Functions, N de rotas, N de componentes, N de migrations
- Ganchos quantificáveis pra LinkedIn ("Em X semanas, Y projetos importados")

### 14. Decisões técnicas marcantes (gold para posts)
Lista de 5–8 decisões com formato:
- **Contexto** → **Opções** → **Escolha** → **Resultado**
Exemplos:
- Múltiplos responsáveis: por que tabela de junção em vez de array
- Roles separadas de profiles
- Importação em massa com IA vs. CSV puro
- DOCX no client vs. servidor

### 15. Roadmap / próximos passos
Indicação aberta para gerar posts de "o que vem aí".

### 16. Glossário e referências
Termos do domínio + links internos.

## Detalhes de execução
- Arquivo: sobrescrever `CONTEXT.md` na raiz
- Tamanho esperado: ~600–900 linhas, ainda em markdown puro
- Sem emojis (padrão Lovable)
- Tom: técnico mas com ganchos narrativos; trechos prontos para virar legenda
- Diagramas em blocos ```text
- Tabelas comparativas onde fizer sentido
- Cada seção termina com uma linha **"Ângulo para post"** sugerindo um gancho de LinkedIn

## Confirmação
Sigo expandindo `CONTEXT.md` com essa estrutura?
