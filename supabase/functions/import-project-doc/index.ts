import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  // DOCX is a ZIP containing XML files. We parse word/document.xml for text.
  // Using Deno's built-in zip support via a simple approach
  const uint8 = new Uint8Array(buffer);

  // Find all XML text content by looking for <w:t> tags in the raw bytes
  const decoder = new TextDecoder();
  const raw = decoder.decode(uint8);

  // Try to find the PK zip signature and locate word/document.xml
  // Simple approach: search for XML-like content between w:t tags
  const texts: string[] = [];
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;

  // First, try to decompress using DecompressionStream if available
  try {
    const entries = await findZipEntries(uint8);
    for (const entry of entries) {
      if (entry.name.includes("word/document") || entry.name.includes("word/header") || entry.name.includes("word/footer")) {
        const xml = decoder.decode(entry.data);
        while ((match = regex.exec(xml)) !== null) {
          texts.push(match[1]);
        }
      }
    }
    if (texts.length > 0) return texts.join(" ");
  } catch {
    // fallback
  }

  // Fallback: try raw regex on the entire buffer (works for some docx)
  while ((match = regex.exec(raw)) !== null) {
    texts.push(match[1]);
  }

  return texts.join(" ") || raw.substring(0, 50000);
}

async function findZipEntries(data: Uint8Array): Promise<Array<{ name: string; data: Uint8Array }>> {
  const entries: Array<{ name: string; data: Uint8Array }> = [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  while (offset < data.length - 4) {
    // Local file header signature = 0x04034b50
    if (view.getUint32(offset, true) !== 0x04034b50) {
      offset++;
      continue;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(data.slice(offset + 30, offset + 30 + nameLen));
    const dataStart = offset + 30 + nameLen + extraLen;
    const compressedData = data.slice(dataStart, dataStart + compressedSize);

    if (name.endsWith(".xml") && (name.includes("word/document") || name.includes("word/header"))) {
      try {
        if (compressionMethod === 8) {
          // Deflate
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const totalLen = chunks.reduce((a, c) => a + c.length, 0);
          const result = new Uint8Array(totalLen);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          entries.push({ name, data: result });
        } else if (compressionMethod === 0) {
          entries.push({ name, data: compressedData });
        }
      } catch {
        // skip entry
      }
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    let text = "";

    if (file.name.endsWith(".docx")) {
      text = await extractTextFromDocx(buffer);
    } else if (file.name.endsWith(".pdf")) {
      // For PDF, extract readable text (basic approach)
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const raw = decoder.decode(buffer);
      // Extract text between stream/endstream or parentheses
      const parts: string[] = [];
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let m;
      while ((m = streamRegex.exec(raw)) !== null) {
        const cleaned = m[1].replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ");
        if (cleaned.trim().length > 10) parts.push(cleaned.trim());
      }
      // Also try extracting text from Tj/TJ operators
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      while ((m = tjRegex.exec(raw)) !== null) {
        parts.push(m[1]);
      }
      text = parts.join("\n").substring(0, 50000) || "Não foi possível extrair texto do PDF. Tente enviar em formato DOCX.";
    } else {
      // Try as plain text
      text = new TextDecoder().decode(buffer).substring(0, 50000);
    }

    if (text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair texto suficiente do documento. Tente enviar em formato DOCX." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI to extract structured project data
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que extrai dados de projetos a partir de documentos de planejamento.
Analise o texto e extraia todas as informações possíveis sobre o projeto.
Use a função extract_project_data para retornar os dados estruturados.
Se não encontrar alguma informação, deixe o campo vazio ou null.
Datas devem estar no formato YYYY-MM-DD.
Para SWOT, classifique os itens corretamente em forças, fraquezas, oportunidades e ameaças.
Para etapas, extraia fases, marcos ou atividades mencionadas.`,
          },
          {
            role: "user",
            content: `Extraia os dados do projeto a partir deste documento:\n\n${text.substring(0, 30000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_project_data",
              description: "Retorna dados estruturados do projeto extraídos do documento",
              parameters: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome/título do projeto" },
                  descricao: { type: "string", description: "Descrição ou justificativa do projeto" },
                  data_inicio: { type: "string", description: "Data de início no formato YYYY-MM-DD" },
                  data_fim: { type: "string", description: "Data de fim no formato YYYY-MM-DD" },
                  orcamento_previsto: { type: "number", description: "Orçamento previsto em reais" },
                  centro_custo: { type: "string", description: "Centro de custo" },
                  estimativa_prazo: { type: "string", description: "Estimativa de prazo textual" },
                  entregas_esperadas: { type: "string", description: "Entregas esperadas do projeto" },
                  etapas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        descricao: { type: "string" },
                        data_inicio: { type: "string" },
                        data_fim: { type: "string" },
                      },
                      required: ["nome"],
                    },
                  },
                  swot: {
                    type: "object",
                    properties: {
                      forca: { type: "array", items: { type: "string" } },
                      fraqueza: { type: "array", items: { type: "string" } },
                      oportunidade: { type: "array", items: { type: "string" } },
                      ameaca: { type: "array", items: { type: "string" } },
                    },
                  },
                },
                required: ["nome"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_project_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para processar o documento." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro ao processar documento com IA");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("IA não retornou dados estruturados");
    }

    const projectData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(projectData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-project-doc error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
