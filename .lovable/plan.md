

## Sistema de Notificacoes

### Resumo
Criar um sistema de notificacoes in-app que avisa usuarios sobre aprovacoes de propostas, atrasos em etapas e novos comentarios nos projetos. Inclui tabela no banco, icone de sino no header com badge de contagem, e painel dropdown para listar/marcar como lidas.

### Arquitetura

```text
[Evento acontece] --> [INSERT na tabela notificacoes] --> [Frontend poll/realtime] --> [Badge + Dropdown]
```

Eventos que geram notificacao:
1. **Aprovacao/Rejeicao de proposta** - notifica o proponente
2. **Novo comentario** - notifica o responsavel do projeto e outros participantes
3. **Etapa atrasada** - notifica o responsavel da etapa e do projeto

### Alteracoes necessarias

#### 1. Backend - Tabela e Politicas

**Nova tabela `notificacoes`:**

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid, PK | Identificador |
| usuario_id | uuid, NOT NULL | Destinatario da notificacao |
| tipo | text, NOT NULL | "aprovacao", "rejeicao", "comentario", "atraso" |
| titulo | text, NOT NULL | Titulo curto (ex: "Proposta aprovada") |
| mensagem | text | Descricao detalhada |
| link | text | Rota para navegacao (ex: "/projetos/uuid") |
| lida | boolean, default false | Se ja foi vista |
| created_at | timestamptz, default now() | Data de criacao |

**Politicas RLS:**
- SELECT: usuario ve apenas suas proprias notificacoes (`usuario_id = auth.uid()`)
- INSERT: usuarios autenticados podem inserir (para permitir que o sistema crie notificacoes em nome de acoes de outros usuarios)
- UPDATE: usuario pode atualizar apenas as proprias (marcar como lida)
- DELETE: usuario pode excluir apenas as proprias

**Realtime:** habilitar na tabela para atualizacao instantanea no frontend.

#### 2. Frontend - Componente de Notificacoes

**Novo componente: `src/components/NotificacoesDropdown.tsx`**

- Icone de sino (Bell) no header do layout com badge vermelho mostrando contagem de nao lidas
- Ao clicar, abre um Popover/Dropdown com lista das ultimas notificacoes
- Cada notificacao mostra:
  - Icone baseado no tipo (Check para aprovacao, X para rejeicao, MessageSquare para comentario, AlertTriangle para atraso)
  - Titulo e mensagem truncada
  - Tempo relativo ("ha 5 min")
  - Notificacoes nao lidas com fundo destacado
- Ao clicar em uma notificacao: marca como lida e navega para o link
- Botao "Marcar todas como lidas" no topo
- Usa Supabase Realtime para receber novas notificacoes sem refresh

#### 3. Integracao no AppLayout

Adicionar uma barra de header no `AppLayout` entre a sidebar e o conteudo, contendo o componente `NotificacoesDropdown` alinhado a direita.

#### 4. Geracao de Notificacoes

Modificar os seguintes fluxos existentes para criar notificacoes:

**`src/pages/Aprovacoes.tsx` - handleApproval:**
Apos aprovar/rejeitar, inserir notificacao para o proponente:
- tipo: "aprovacao" ou "rejeicao"
- titulo: "Proposta aprovada!" ou "Proposta rejeitada"
- mensagem: titulo da proposta + comentario (se houver)
- link: "/projetos/{id}" (se aprovado e projeto gerado) ou null

**`src/pages/ProjetoDetalhe.tsx` - ao adicionar comentario:**
Inserir notificacao para o responsavel do projeto (se diferente do autor):
- tipo: "comentario"
- titulo: "Novo comentario no projeto X"
- mensagem: trecho do comentario
- link: "/projetos/{id}"

**`src/pages/Dashboard.tsx` ou via trigger SQL - atrasos:**
Criar uma funcao SQL ou edge function agendada que verifica etapas com `data_fim < now()` e `status != 'concluido'`, e cria notificacoes de atraso para os responsaveis (evitando duplicatas).

Para simplificar a primeira versao, as notificacoes de atraso serao geradas client-side quando o Dashboard carrega, verificando se ja existe notificacao recente para aquela etapa.

### Arquivos alterados/criados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar tabela `notificacoes`, politicas RLS, habilitar realtime |
| `src/components/NotificacoesDropdown.tsx` | Novo componente com dropdown e realtime |
| `src/components/layout/AppLayout.tsx` | Adicionar header com NotificacoesDropdown |
| `src/pages/Aprovacoes.tsx` | Inserir notificacao ao aprovar/rejeitar |
| `src/pages/ProjetoDetalhe.tsx` | Inserir notificacao ao comentar |

### Detalhes Tecnicos

- A tabela usa `usuario_id` (nao FK para auth.users) para manter compatibilidade com o padrao do projeto
- Realtime via `supabase.channel('notificacoes').on('postgres_changes', ...)` filtrado por `usuario_id`
- Polling como fallback nao sera necessario com realtime habilitado
- Notificacoes de atraso: na v1, geradas no client ao carregar o Dashboard; em versao futura pode ser um cron job via edge function

