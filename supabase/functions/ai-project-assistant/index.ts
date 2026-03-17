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
    } else if (mode === "etapa-descricao") {
      return await handleEtapaDescricao(context, LOVABLE_API_KEY);
    } else if (mode === "docx") {
      return await handleDocx(context, LOVABLE_API_KEY);
    } else if (mode === "extract-kpis") {
      return await handleExtractKpis(context, LOVABLE_API_KEY);
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
    ctx.progresso ? `Progresso: ${ctx.progresso}%` : "",
    ctx.orcamento ? `Orçamento previsto: R$ ${ctx.orcamento}` : "",
    ctx.gasto ? `Valor gasto: R$ ${ctx.gasto}` : "",
    ctx.dataInicio ? `Início: ${ctx.dataInicio}` : "",
    ctx.dataFim ? `Prazo: ${ctx.dataFim}` : "",
    ctx.area ? `Área: ${ctx.area}` : "",
    ctx.objetivo ? `Objetivo estratégico: ${ctx.objetivo}` : "",
    ctx.responsavel ? `Responsável: ${ctx.responsavel}` : "",
  ].filter(Boolean);

  if (ctx.etapas?.length) {
    parts.push("\nEtapas:");
    ctx.etapas.forEach((e: any) => parts.push(`- ${e.nome} (${e.status})${e.descricao ? ': ' + e.descricao : ''}`));
  }

  if (ctx.swot) {
    parts.push("\nAnálise SWOT atual:");
    for (const [tipo, items] of Object.entries(ctx.swot)) {
      if ((items as string[]).length) {
        parts.push(`${tipo}: ${(items as string[]).join("; ")}`);
      }
    }
  }

  if (ctx.kpis?.length) {
    parts.push("\nKPIs:");
    ctx.kpis.forEach((k: any) => parts.push(`- ${k.nome}: meta ${k.meta} ${k.unidade}`));
  }

  return parts.join("\n");
}

async function handleDocx(ctx: any, apiKey: string) {
  const systemPrompt = `Você é um consultor de gestão estratégica para uma organização pública/religiosa brasileira (Igreja Comunidade Batista do Rio de Janeiro - CBRio).
Analise o projeto fornecido e gere textos profissionais para as seguintes seções de um documento de planejamento estratégico:

1. resumo_executivo: 2-3 parágrafos descrevendo o projeto, seus objetivos e importância. Seja formal e estratégico.
2. direcionadores: 2-3 parágrafos sobre os direcionadores estratégicos do projeto, alinhados à missão da CBRio ("Alcançar pessoas para Jesus!") e seus valores (servir em comunidade, viver generosamente, excelência). Explique como o projeto se conecta a esses valores.
3. diagnostico: 2-3 parágrafos sobre o diagnóstico situacional - a situação atual que motivou o projeto e a situação desejada após sua conclusão.
4. consideracoes_finais: 2-3 parágrafos com considerações finais sobre o impacto esperado do projeto, sua viabilidade e o compromisso da CBRio com a excelência na gestão.

Use os dados reais do projeto fornecidos. Separe parágrafos com duas quebras de linha (\\n\\n). Responda em português brasileiro formal.`;

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
      tools: [
        {
          type: "function",
          function: {
            name: "generate_docx_content",
            description: "Retorna textos profissionais para o documento DOCX de planejamento estratégico.",
            parameters: {
              type: "object",
              properties: {
                resumo_executivo: { type: "string", description: "Texto do resumo executivo (2-3 parágrafos separados por \\n\\n)" },
                direcionadores: { type: "string", description: "Texto dos direcionadores estratégicos (2-3 parágrafos separados por \\n\\n)" },
                diagnostico: { type: "string", description: "Texto do diagnóstico situacional (2-3 parágrafos separados por \\n\\n)" },
                consideracoes_finais: { type: "string", description: "Texto das considerações finais (2-3 parágrafos separados por \\n\\n)" },
              },
              required: ["resumo_executivo", "direcionadores", "diagnostico", "consideracoes_finais"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_docx_content" } },
    }),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return new Response(JSON.stringify({
      resumo_executivo: "Informações insuficientes para gerar o resumo executivo.",
      direcionadores: "Informações insuficientes para gerar os direcionadores estratégicos.",
      diagnostico: "Informações insuficientes para gerar o diagnóstico.",
      consideracoes_finais: "Informações insuficientes para gerar as considerações finais.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const args = JSON.parse(toolCall.function.arguments);
  return new Response(JSON.stringify(args), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

async function handleExtractKpis(ctx: any, apiKey: string) {
  const existingKpis = ctx.existingKpis?.length
    ? `\nKPIs já existentes: ${ctx.existingKpis.join("; ")}`
    : "\nNenhum KPI cadastrado ainda.";

  const systemPrompt = `Você é um consultor de gestão estratégica para uma organização brasileira.
Analise o projeto e sugira entre 3 e 6 KPIs (indicadores-chave de desempenho) que sejam relevantes para medir o sucesso do projeto.
Cada KPI deve ter: nome curto, descrição de uma frase, unidade de medida (%, unidades, R$, etc.), meta numérica realista e periodicidade (mensal, trimestral, semestral ou anual).
Não repita KPIs já existentes. Seja específico e prático.`;

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
        { role: "user", content: buildProjectPrompt(ctx) + existingKpis },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_kpis",
            description: "Retorna sugestões de KPIs para o projeto.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nome: { type: "string", description: "Nome curto do KPI" },
                      descricao: { type: "string", description: "Descrição do que o KPI mede" },
                      unidade: { type: "string", description: "Unidade de medida (%, unidades, R$)" },
                      meta: { type: "number", description: "Meta numérica" },
                      periodicidade: { type: "string", enum: ["mensal", "trimestral", "semestral", "anual"] },
                    },
                    required: ["nome", "descricao", "unidade", "meta", "periodicidade"],
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
      tool_choice: { type: "function", function: { name: "suggest_kpis" } },
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

async function handleEtapaDescricao(ctx: any, apiKey: string) {
  const systemPrompt = `Você é um consultor de gestão de projetos para uma organização brasileira.
Com base no projeto e no nome da etapa fornecida, gere uma descrição curta e objetiva (1 a 3 frases) para essa etapa.
A descrição deve explicar o que será feito nessa etapa, seu objetivo e entregáveis esperados.
Responda apenas com o texto da descrição, sem formatação extra.`;

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
        { role: "user", content: buildProjectPrompt(ctx) + `\n\nEtapa para descrever: "${ctx.etapaNome}"` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_etapa_descricao",
            description: "Retorna uma descrição curta e objetiva para a etapa do projeto.",
            parameters: {
              type: "object",
              properties: {
                descricao: { type: "string", description: "Descrição da etapa (1-3 frases)" },
              },
              required: ["descricao"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_etapa_descricao" } },
    }),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return new Response(JSON.stringify({ descricao: "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const args = JSON.parse(toolCall.function.arguments);
  return new Response(JSON.stringify(args), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
