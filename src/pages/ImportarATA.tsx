import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Loader2, Check, X, ChevronDown, ChevronUp, Calendar, DollarSign, ListChecks, AlignLeft } from "lucide-react";

interface SuggestedStage {
  nome: string;
  descricao: string;
}

interface ProjectSuggestion {
  projeto_id: string;
  projeto_nome: string;
  descricao_adicional?: string;
  orcamento_previsto?: number;
  data_inicio?: string;
  data_fim?: string;
  novas_etapas?: SuggestedStage[];
}

export default function ImportarATA() {
  const navigate = useNavigate();
  const [ataContent, setAtaContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { desc: boolean; orc: boolean; di: boolean; df: boolean; etapas: boolean[] }>>({});
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setAtaContent(text);
      return;
    }

    // For PDF/DOCX, we need to extract text via edge function
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const { data, error } = await supabase.functions.invoke("import-project-doc", {
          body: { fileContent: base64, fileName: file.name },
        });
        if (error) throw error;
        if (data?.extractedText) {
          setAtaContent(data.extractedText);
        } else {
          toast.error("Não foi possível extrair o texto do arquivo.");
        }
      } catch {
        toast.error("Erro ao processar o arquivo. Tente colar o conteúdo manualmente.");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const processATA = async () => {
    if (!ataContent.trim()) {
      toast.error("Cole ou envie o conteúdo da ATA primeiro.");
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ ataContent: ataContent.trim() }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao processar ATA");
      }

      const result = await res.json();
      const sugs = result.suggestions || [];
      setSuggestions(sugs);

      // Initialize selections - all checked by default
      const sel: typeof selectedItems = {};
      sugs.forEach((s: ProjectSuggestion) => {
        sel[s.projeto_id] = {
          desc: !!s.descricao_adicional,
          orc: s.orcamento_previsto != null,
          di: !!s.data_inicio,
          df: !!s.data_fim,
          etapas: (s.novas_etapas || []).map(() => true),
        };
      });
      setSelectedItems(sel);
      setExpandedProjects(new Set(sugs.map((s: ProjectSuggestion) => s.projeto_id)));

      if (sugs.length === 0) {
        toast.info("Nenhuma atualização identificada na ATA para os projetos existentes.");
      } else {
        toast.success(`${sugs.length} projeto(s) com atualizações sugeridas!`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar ATA");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applySuggestions = async () => {
    setApplying(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const sug of suggestions) {
        const sel = selectedItems[sug.projeto_id];
        if (!sel) continue;

        // Build update object
        const update: Record<string, any> = {};
        if (sel.desc && sug.descricao_adicional) {
          // Fetch current description to append
          const { data: proj } = await supabase
            .from("projetos")
            .select("descricao")
            .eq("id", sug.projeto_id)
            .single();
          const currentDesc = proj?.descricao || "";
          update.descricao = currentDesc
            ? `${currentDesc}\n\n--- Atualização da ATA (${new Date().toLocaleDateString("pt-BR")}) ---\n${sug.descricao_adicional}`
            : sug.descricao_adicional;
        }
        if (sel.orc && sug.orcamento_previsto != null) update.orcamento_previsto = sug.orcamento_previsto;
        if (sel.di && sug.data_inicio) update.data_inicio = sug.data_inicio;
        if (sel.df && sug.data_fim) update.data_fim = sug.data_fim;

        // Apply project update
        if (Object.keys(update).length > 0) {
          const { error } = await supabase
            .from("projetos")
            .update(update)
            .eq("id", sug.projeto_id);
          if (error) {
            console.error(`Error updating ${sug.projeto_nome}:`, error);
            errorCount++;
            continue;
          }
        }

        // Create new stages
        if (sug.novas_etapas?.length) {
          const stagesToCreate = sug.novas_etapas
            .filter((_, i) => sel.etapas[i])
            .map((etapa, i) => ({
              projeto_id: sug.projeto_id,
              nome: etapa.nome,
              descricao: etapa.descricao,
              status: "nao_iniciado" as const,
              ordem: i,
            }));

          if (stagesToCreate.length > 0) {
            const { error } = await supabase.from("etapas_projeto").insert(stagesToCreate);
            if (error) {
              console.error(`Error creating stages for ${sug.projeto_nome}:`, error);
              errorCount++;
              continue;
            }
          }
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} projeto(s) atualizado(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} projeto(s) com erro na atualização.`);
      }
      if (successCount > 0 && errorCount === 0) {
        setTimeout(() => navigate("/projetos"), 1500);
      }
    } catch (e: any) {
      toast.error("Erro ao aplicar atualizações: " + (e.message || ""));
    } finally {
      setApplying(false);
    }
  };

  const hasAnySelected = suggestions.some(s => {
    const sel = selectedItems[s.projeto_id];
    if (!sel) return false;
    return sel.desc || sel.orc || sel.di || sel.df || sel.etapas.some(Boolean);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Importar ATA de Reunião</h1>
        <p className="text-muted-foreground mt-1">
          Envie uma ATA e a IA extrairá informações para atualizar seus projetos automaticamente.
        </p>
      </div>

      {/* Upload / Input area */}
      {suggestions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conteúdo da ATA
            </CardTitle>
            <CardDescription>Envie um arquivo ou cole o texto da ATA abaixo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("ata-file-input")?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {fileName ? (
                  <span className="text-foreground font-medium">{fileName}</span>
                ) : (
                  <>Arraste um arquivo ou clique para selecionar<br /><span className="text-xs">PDF, DOCX ou TXT</span></>
                )}
              </p>
              <input
                id="ata-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </div>

            <div className="text-center text-xs text-muted-foreground">ou cole o texto manualmente</div>

            <Textarea
              value={ataContent}
              onChange={(e) => setAtaContent(e.target.value)}
              placeholder="Cole aqui o conteúdo da ATA..."
              className="min-h-[200px] text-sm"
            />

            <Button onClick={processATA} disabled={loading || !ataContent.trim()} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analisando com IA...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Analisar ATA e Sugerir Atualizações</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggestions review */}
      {suggestions.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {suggestions.length} projeto(s) identificado(s)
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSuggestions([]); setSelectedItems({}); }}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={applySuggestions} disabled={applying || !hasAnySelected}>
                {applying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Aplicando...</>
                ) : (
                  <><Check className="h-4 w-4" /> Aplicar Selecionados</>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map((sug) => {
              const sel = selectedItems[sug.projeto_id];
              const isExpanded = expandedProjects.has(sug.projeto_id);
              const updateCount = [
                sel?.desc && sug.descricao_adicional,
                sel?.orc && sug.orcamento_previsto != null,
                sel?.di && sug.data_inicio,
                sel?.df && sug.data_fim,
                sug.novas_etapas?.some((_, i) => sel?.etapas[i]),
              ].filter(Boolean).length;

              return (
                <Card key={sug.projeto_id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleProject(sug.projeto_id)}
                  >
                    <div className="flex items-center gap-3">
                      <FolderIcon />
                      <div>
                        <p className="font-medium text-foreground">{sug.projeto_nome}</p>
                        <p className="text-xs text-muted-foreground">{updateCount} atualização(ões) selecionada(s)</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && sel && (
                    <div className="border-t border-border px-4 py-3 space-y-3">
                      {sug.descricao_adicional && (
                        <SuggestionRow
                          icon={<AlignLeft className="h-4 w-4" />}
                          label="Descrição"
                          badge="Complementar"
                          checked={sel.desc}
                          onChange={(v) => setSelectedItems(prev => ({ ...prev, [sug.projeto_id]: { ...prev[sug.projeto_id], desc: v } }))}
                        >
                          <p className="text-sm text-muted-foreground mt-1">{sug.descricao_adicional}</p>
                        </SuggestionRow>
                      )}

                      {sug.orcamento_previsto != null && (
                        <SuggestionRow
                          icon={<DollarSign className="h-4 w-4" />}
                          label="Orçamento"
                          badge={`R$ ${sug.orcamento_previsto.toLocaleString("pt-BR")}`}
                          checked={sel.orc}
                          onChange={(v) => setSelectedItems(prev => ({ ...prev, [sug.projeto_id]: { ...prev[sug.projeto_id], orc: v } }))}
                        />
                      )}

                      {sug.data_inicio && (
                        <SuggestionRow
                          icon={<Calendar className="h-4 w-4" />}
                          label="Data de início"
                          badge={new Date(sug.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                          checked={sel.di}
                          onChange={(v) => setSelectedItems(prev => ({ ...prev, [sug.projeto_id]: { ...prev[sug.projeto_id], di: v } }))}
                        />
                      )}

                      {sug.data_fim && (
                        <SuggestionRow
                          icon={<Calendar className="h-4 w-4" />}
                          label="Prazo / Data fim"
                          badge={new Date(sug.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                          checked={sel.df}
                          onChange={(v) => setSelectedItems(prev => ({ ...prev, [sug.projeto_id]: { ...prev[sug.projeto_id], df: v } }))}
                        />
                      )}

                      {sug.novas_etapas && sug.novas_etapas.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <ListChecks className="h-4 w-4" />
                            Novas etapas
                          </div>
                          {sug.novas_etapas.map((etapa, i) => (
                            <div key={i} className="flex items-start gap-2 ml-6">
                              <Checkbox
                                checked={sel.etapas[i]}
                                onCheckedChange={(v) => {
                                  setSelectedItems(prev => {
                                    const newEtapas = [...prev[sug.projeto_id].etapas];
                                    newEtapas[i] = !!v;
                                    return { ...prev, [sug.projeto_id]: { ...prev[sug.projeto_id], etapas: newEtapas } };
                                  });
                                }}
                                className="mt-0.5"
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">{etapa.nome}</p>
                                <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FolderIcon() {
  return (
    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
      <FileText className="h-4 w-4 text-primary" />
    </div>
  );
}

function SuggestionRow({
  icon, label, badge, checked, onChange, children,
}: {
  icon: React.ReactNode;
  label: string;
  badge: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-foreground">{label}</span>
          <Badge variant="secondary" className="text-xs">{badge}</Badge>
        </div>
        {children}
      </div>
    </div>
  );
}
