import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader?.replace("Bearer ", "") ?? ""
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ataContent } = await req.json();
    if (!ataContent || typeof ataContent !== "string") {
      return new Response(JSON.stringify({ error: "Conteúdo da ATA é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing projects
    const { data: projetos, error: projError } = await supabase
      .from("projetos")
      .select("id, nome, descricao, status, orcamento_previsto, data_inicio, data_fim, valor_gasto")
      .order("nome");

    if (projError) throw projError;

    const projectList = projetos?.map((p: any) => 
      `- ${p.nome} (ID: ${p.id}) | Status: ${p.status} | Orçamento: ${p.orcamento_previsto ?? 'N/A'} | Desc: ${p.descricao ?? 'N/A'}`
    ).join("\n") || "Nenhum projeto encontrado.";

    // Also fetch existing stages per project
    const { data: etapas } = await supabase
      .from("etapas_projeto")
      .select("id, nome, projeto_id, status");

    const etapasByProject: Record<string, string[]> = {};
    etapas?.forEach((e: any) => {
      if (!etapasByProject[e.projeto_id]) etapasByProject[e.projeto_id] = [];
      etapasByProject[e.projeto_id].push(e.nome);
    });

    const etapasInfo = Object.entries(etapasByProject)
      .map(([pid, names]) => `Projeto ${pid}: etapas existentes: ${names.join(", ")}`)
      .join("\n");

    const systemPrompt = `Você é um analista de gestão estratégica. Recebeu uma ATA de reunião e uma lista de projetos existentes no sistema.
Sua tarefa é extrair informações da ATA que possam ser usadas para atualizar os projetos existentes.

Para cada projeto que você identificar na ATA, sugira as atualizações possíveis:
- descricao: texto complementar para adicionar à descrição existente
- orcamento_previsto: novo valor de orçamento (número, apenas se mencionado explicitamente)
- data_inicio: nova data de início (formato YYYY-MM-DD, apenas se mencionada)
- data_fim: nova data fim/prazo (formato YYYY-MM-DD, apenas se mencionada)
- novas_etapas: array de novas etapas a criar (nome e descrição curta), NÃO repita etapas já existentes

IMPORTANTE:
- Só sugira atualizações para projetos que realmente aparecem na ATA
- Use o ID exato do projeto da lista fornecida
- Não invente dados, extraia apenas o que está na ATA
- Datas devem considerar o ano 2026 se não especificado
- Para orçamentos, converta para número (ex: "R$ 50 mil" = 50000)

Projetos existentes no sistema:
${projectList}

Etapas existentes:
${etapasInfo || "Nenhuma etapa cadastrada."}`;

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `ATA da reunião:\n\n${ataContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_project_updates",
              description: "Retorna sugestões de atualizações para projetos existentes com base na ATA.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        projeto_id: { type: "string", description: "UUID do projeto existente" },
                        projeto_nome: { type: "string", description: "Nome do projeto (para referência)" },
                        descricao_adicional: { type: "string", description: "Texto para complementar a descrição do projeto" },
                        orcamento_previsto: { type: "number", description: "Novo orçamento previsto (null se não mencionado)" },
                        data_inicio: { type: "string", description: "Nova data de início YYYY-MM-DD (null se não mencionada)" },
                        data_fim: { type: "string", description: "Nova data fim YYYY-MM-DD (null se não mencionada)" },
                        novas_etapas: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              nome: { type: "string" },
                              descricao: { type: "string" },
                            },
                            required: ["nome", "descricao"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["projeto_id", "projeto_nome"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_project_updates" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-ata error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
