import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { mode, context } = await req.json();

    if (mode === "analise") {
      return await handleAnalise(context, LOVABLE_API_KEY);
    } else if (mode === "swot") {
      return await handleSwot(context, LOVABLE_API_KEY);
    } else if (mode === "etapas") {
      return await handleEtapas(context, LOVABLE_API_KEY);
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-project-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildProjectPrompt(ctx: any): string {
  const parts = [
    `Projeto: ${ctx.nome}`,
    ctx.descricao ? `Descrição: ${ctx.descricao}` : "",
    `Status: ${ctx.status}`,
    `Progresso: ${ctx.progresso}%`,
    ctx.orcamento ? `Orçamento previsto: R$ ${ctx.orcamento}` : "",
    ctx.gasto ? `Valor gasto: R$ ${ctx.gasto}` : "",
    ctx.dataInicio ? `Início: ${ctx.dataInicio}` : "",
    ctx.dataFim ? `Prazo: ${ctx.dataFim}` : "",
  ].filter(Boolean);

  if (ctx.etapas?.length) {
    parts.push("\nEtapas:");
    ctx.etapas.forEach((e: any) => parts.push(`- ${e.nome} (${e.status})`));
  }

  if (ctx.swot) {
    parts.push("\nAnálise SWOT atual:");
    for (const [tipo, items] of Object.entries(ctx.swot)) {
      if ((items as string[]).length) {
        parts.push(`${tipo}: ${(items as string[]).join("; ")}`);
      }
    }
  }

  return parts.join("\n");
}

async function handleAnalise(ctx: any, apiKey: string) {
  const systemPrompt = `Você é um consultor de gestão de projetos estratégicos para uma organização pública brasileira. 
Analise o projeto fornecido e retorne uma análise completa em markdown com as seguintes seções:
## 🔍 Análise de Riscos
## 💡 Sugestões de Próximos Passos
## 📊 Recomendações de Melhoria
## ⚠️ Alertas

Seja direto, prático e baseado nos dados fornecidos. Use bullet points. Responda em português brasileiro.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildProjectPrompt(ctx) },
      ],
      stream: true,
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
      return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await response.text();
    console.error("Gateway error:", status, t);
    return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function handleSwot(ctx: any, apiKey: string) {
  const tipoLabels: Record<string, string> = {
    forca: "Forças", fraqueza: "Fraquezas", oportunidade: "Oportunidades", ameaca: "Ameaças",
  };
  const label = tipoLabels[ctx.tipo] || ctx.tipo;

  const systemPrompt = `Você é um consultor de gestão estratégica para uma organização pública brasileira.
Analise o projeto e sugira itens para o quadrante "${label}" da análise SWOT.
Considere os itens já existentes para não repetir. Sugira entre 3 e 5 itens novos e relevantes.
Cada item deve ser uma frase curta e objetiva (máximo 15 palavras).`;

  const existingItems = ctx.existingItems?.length
    ? `\nItens já existentes em ${label}: ${ctx.existingItems.join("; ")}`
    : "";

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildProjectPrompt(ctx) + existingItems },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_swot_items",
            description: `Retorna sugestões de itens para o quadrante ${label} da SWOT.`,
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_swot_items" } },
    }),
  });

  if (!response.ok) {
    return handleGatewayError(response);
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
}

async function handleEtapas(ctx: any, apiKey: string) {
  const systemPrompt = `Você é um consultor de gestão de projetos para uma organização pública brasileira.
Analise o projeto e as etapas existentes. Sugira entre 3 e 5 etapas que estejam faltando para o sucesso do projeto.
Cada etapa deve ter um nome curto e uma descrição de uma frase.`;

  const existingStages = ctx.etapas?.length
    ? `\nEtapas já existentes: ${ctx.etapas.map((e: any) => e.nome).join("; ")}`
    : "\nNenhuma etapa cadastrada ainda.";

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildProjectPrompt(ctx) + existingStages },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_etapas",
            description: "Retorna sugestões de etapas para o projeto.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
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
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_etapas" } },
    }),
  });

  if (!response.ok) {
    return handleGatewayError(response);
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
}

async function handleGatewayError(response: Response) {
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (response.status === 402) {
    return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
      status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const t = await response.text();
  console.error("Gateway error:", response.status, t);
  return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
    status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
