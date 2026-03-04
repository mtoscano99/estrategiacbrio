import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, FileStack, ChevronDown, ChevronUp } from "lucide-react";

interface ExtractedEtapa {
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
}

interface ExtractedSwot {
  forca?: string[];
  fraqueza?: string[];
  oportunidade?: string[];
  ameaca?: string[];
}

interface ExtractedKPI {
  nome: string;
  descricao?: string;
  unidade?: string;
  meta?: number;
  periodicidade?: string;
}

interface ExtractedProject {
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  orcamento_previsto?: number;
  centro_custo?: string;
  etapas?: ExtractedEtapa[];
  swot?: ExtractedSwot;
  kpis?: ExtractedKPI[];
  selected: boolean;
}

export default function ImportarProjetosMassa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<ExtractedProject[]>([]);
  const [globalAreaId, setGlobalAreaId] = useState("");
  const [globalCategoriaId, setGlobalCategoriaId] = useState("");
  const [globalResponsavelId, setGlobalResponsavelId] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("areas_estrategicas").select("id, nome"),
      supabase.from("profiles").select("id, nome, avatar_url"),
      supabase.from("categorias_projeto").select("id, nome, cor").order("nome"),
    ]).then(([areasRes, profilesRes, catRes]) => {
      if (areasRes.data) setAreas(areasRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (catRes.data) setCategorias(catRes.data as any);
    });
  }, []);

  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });

  const processFiles = async (files: FileList | File[]) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
      "text/plain",
    ];
    const validFiles = Array.from(files).filter(file => {
      const isAllowed = allowedTypes.includes(file.type) || file.name.endsWith(".docx") || file.name.endsWith(".pdf") || file.name.endsWith(".txt");
      if (!isAllowed) return false;
      if (file.size > 10 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) {
      toast.error("Nenhum arquivo válido. Envie arquivos DOCX, PDF ou TXT (máx 10MB).");
      return;
    }

    setImporting(true);
    setProcessProgress({ current: 0, total: validFiles.length });
    const allProjects: ExtractedProject[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setProcessProgress({ current: i + 1, total: validFiles.length });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-projects-bulk`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Erro" }));
          errors.push(`${file.name}: ${err.error || "Erro ao processar"}`);
          continue;
        }

        const data = await response.json();
        const extracted = (data.projetos || []).map((p: any) => ({
          ...p,
          selected: true,
        }));
        allProjects.push(...extracted);
      } catch (error: any) {
        errors.push(`${file.name}: ${error.message || "Erro"}`);
      }
    }

    if (allProjects.length > 0) {
      setProjects(prev => [...prev, ...allProjects]);
      toast.success(`${allProjects.length} projeto(s) extraído(s) de ${validFiles.length} arquivo(s). Revise e confirme.`);
    } else {
      toast.error("Nenhum projeto encontrado nos arquivos enviados.");
    }

    if (errors.length > 0) {
      toast.error(`Erros em ${errors.length} arquivo(s): ${errors[0]}`);
    }

    setImporting(false);
    setProcessProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) processFiles(files);
  };

  const updateProject = (idx: number, field: string, value: any) => {
    setProjects(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const updateEtapa = (projIdx: number, etapaIdx: number, field: string, value: string) => {
    setProjects(prev => prev.map((p, i) => {
      if (i !== projIdx) return p;
      const etapas = [...(p.etapas || [])];
      etapas[etapaIdx] = { ...etapas[etapaIdx], [field]: value };
      return { ...p, etapas };
    }));
  };

  const removeEtapa = (projIdx: number, etapaIdx: number) => {
    setProjects(prev => prev.map((p, i) => {
      if (i !== projIdx) return p;
      return { ...p, etapas: (p.etapas || []).filter((_, ei) => ei !== etapaIdx) };
    }));
  };

  const selectedProjects = projects.filter(p => p.selected);

  const handleCreateAll = async () => {
    if (!user || selectedProjects.length === 0) return;
    setLoading(true);

    try {
      let created = 0;
      for (const proj of selectedProjects) {
        const { data: projeto, error } = await supabase.from("projetos").insert({
          nome: proj.nome,
          descricao: proj.descricao || null,
          area_id: globalAreaId || null,
          categoria_id: globalCategoriaId || null,
          responsavel_id: globalResponsavelId || user.id,
          data_inicio: proj.data_inicio || null,
          data_fim: proj.data_fim || null,
          orcamento_previsto: proj.orcamento_previsto || 0,
          centro_custo: proj.centro_custo || null,
        } as any).select("id").single();

        if (error) {
          console.error(`Erro ao criar projeto "${proj.nome}":`, error);
          continue;
        }

        const projetoId = projeto.id;

        // Insert etapas
        if (proj.etapas?.length) {
          const etapasToInsert = proj.etapas.map((et, i) => ({
            projeto_id: projetoId,
            nome: et.nome,
            descricao: et.descricao || null,
            data_inicio: et.data_inicio || null,
            data_fim: et.data_fim || null,
            ordem: i,
          }));
          await supabase.from("etapas_projeto").insert(etapasToInsert as any);
        }

        // Insert SWOT
        if (proj.swot) {
          const swotItems: any[] = [];
          for (const [tipo, items] of Object.entries(proj.swot)) {
            if (items && Array.isArray(items)) {
              for (const desc of items) {
                swotItems.push({ projeto_id: projetoId, tipo, descricao: desc, criado_por: user.id });
              }
            }
          }
          if (swotItems.length > 0) {
            await supabase.from("swot_items").insert(swotItems);
          }
        }

        // Insert KPIs
        if (proj.kpis?.length) {
          const kpisToInsert = proj.kpis.map((k) => ({
            projeto_id: projetoId,
            nome: k.nome,
            descricao: k.descricao || null,
            unidade: k.unidade || "%",
            meta: k.meta || 0,
            periodicidade: k.periodicidade || "mensal",
            criado_por: user.id,
          }));
          await supabase.from("kpis").insert(kpisToInsert as any);
        }

        created++;
      }

      toast.success(`${created} projeto(s) criado(s) com sucesso!`);
      navigate("/projetos");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar projetos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Upload area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"
        } ${importing ? "pointer-events-none opacity-60" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      >
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileStack className="h-6 w-6 text-primary" />
              Importação em Massa
            </h1>
            <p className="text-muted-foreground mt-1">
              Envie um ou mais documentos para criar vários projetos de uma vez
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
            {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processando {processProgress.current}/{processProgress.total}...</>
              ) : (
                <><Upload className="h-4 w-4" /> Enviar Documento</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Múltiplos DOCX, PDF ou TXT · ou arraste aqui</p>
          </div>
        </div>
        {dragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl z-10">
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Solte o arquivo para importar</p>
            </div>
          </div>
        )}
      </div>

      {/* Global selectors */}
      {projects.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-semibold mb-3">Aplicar a todos os projetos selecionados:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {categorias.length > 0 && (
                <div>
                  <Label className="text-xs">Categoria / Pasta</Label>
                  <Select value={globalCategoriaId} onValueChange={setGlobalCategoriaId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || "#6366f1" }} />
                            {c.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Área Estratégica</Label>
                <Select value={globalAreaId} onValueChange={setGlobalAreaId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar área..." /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Responsável</Label>
                <Select value={globalResponsavelId} onValueChange={setGlobalResponsavelId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar responsável..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project cards */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {selectedProjects.length} de {projects.length} projeto(s) selecionado(s)
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setProjects(prev => prev.map(p => ({ ...p, selected: !prev.every(pp => pp.selected) })))}
            >
              {projects.every(p => p.selected) ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          </div>

          {projects.map((proj, idx) => (
            <Card key={idx} className={`transition-opacity ${!proj.selected ? "opacity-50" : ""}`}>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={proj.selected}
                    onCheckedChange={(checked) => updateProject(idx, "selected", !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                      <Input
                        value={proj.nome}
                        onChange={(e) => updateProject(idx, "nome", e.target.value)}
                        className="font-semibold"
                        placeholder="Nome do projeto"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => setProjects(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Textarea
                      value={proj.descricao || ""}
                      onChange={(e) => updateProject(idx, "descricao", e.target.value)}
                      placeholder="Descrição do projeto..."
                      rows={2}
                      className="text-sm"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Início</Label>
                        <Input
                          type="date"
                          value={proj.data_inicio || ""}
                          onChange={(e) => updateProject(idx, "data_inicio", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Fim</Label>
                        <Input
                          type="date"
                          value={proj.data_fim || ""}
                          onChange={(e) => updateProject(idx, "data_fim", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Orçamento</Label>
                        <Input
                          type="number"
                          value={proj.orcamento_previsto || ""}
                          onChange={(e) => updateProject(idx, "orcamento_previsto", Number(e.target.value))}
                          className="text-xs"
                          placeholder="R$"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Centro de Custo</Label>
                        <Input
                          value={proj.centro_custo || ""}
                          onChange={(e) => updateProject(idx, "centro_custo", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <Accordion type="multiple" className="w-full">
                      {/* Etapas */}
                      {proj.etapas && proj.etapas.length > 0 && (
                        <AccordionItem value="etapas">
                          <AccordionTrigger className="text-sm py-2">
                            📋 Etapas ({proj.etapas.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {proj.etapas.map((etapa, ei) => (
                                <div key={ei} className="rounded border bg-muted/30 p-2 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-4 text-center">{ei + 1}</span>
                                    <Input
                                      value={etapa.nome}
                                      onChange={(e) => updateEtapa(idx, ei, "nome", e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="Nome"
                                    />
                                    <Button
                                      type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                      onClick={() => removeEtapa(idx, ei)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pl-6">
                                    <Input
                                      type="date"
                                      value={etapa.data_inicio || ""}
                                      onChange={(e) => updateEtapa(idx, ei, "data_inicio", e.target.value)}
                                      className="h-7 text-xs"
                                    />
                                    <Input
                                      type="date"
                                      value={etapa.data_fim || ""}
                                      onChange={(e) => updateEtapa(idx, ei, "data_fim", e.target.value)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* SWOT */}
                      {proj.swot && Object.values(proj.swot).some(v => v && v.length > 0) && (
                        <AccordionItem value="swot">
                          <AccordionTrigger className="text-sm py-2">
                            🎯 SWOT ({Object.values(proj.swot).reduce((a, b) => a + (b?.length || 0), 0)} itens)
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {(["forca", "fraqueza", "oportunidade", "ameaca"] as const).map(tipo => {
                                const labels: Record<string, string> = {
                                  forca: "💪 Forças", fraqueza: "⚠️ Fraquezas",
                                  oportunidade: "🌟 Oportunidades", ameaca: "🔴 Ameaças",
                                };
                                const items = proj.swot?.[tipo] || [];
                                if (items.length === 0) return null;
                                return (
                                  <div key={tipo} className="rounded border p-2 bg-muted/20">
                                    <p className="font-medium mb-1">{labels[tipo]}</p>
                                    <ul className="space-y-0.5">
                                      {items.map((item, si) => (
                                        <li key={si} className="text-muted-foreground">• {item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* KPIs */}
                      {proj.kpis && proj.kpis.length > 0 && (
                        <AccordionItem value="kpis">
                          <AccordionTrigger className="text-sm py-2">
                            📊 KPIs ({proj.kpis.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {proj.kpis.map((kpi, ki) => (
                                <div key={ki} className="rounded border bg-muted/30 p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-4 text-center">{ki + 1}</span>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium">{kpi.nome}</p>
                                      {kpi.descricao && <p className="text-xs text-muted-foreground">{kpi.descricao}</p>}
                                      <p className="text-xs text-muted-foreground">
                                        Meta: {kpi.meta || 0} {kpi.unidade || "%"} · {kpi.periodicidade || "mensal"}
                                      </p>
                                    </div>
                                    <Button
                                      type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                      onClick={() => {
                                        setProjects(prev => prev.map((p, i) => {
                                          if (i !== idx) return p;
                                          return { ...p, kpis: (p.kpis || []).filter((_, kIdx) => kIdx !== ki) };
                                        }));
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/projetos")}>Cancelar</Button>
            <Button
              onClick={handleCreateAll}
              disabled={loading || selectedProjects.length === 0}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
              ) : (
                `Criar ${selectedProjects.length} Projeto(s)`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
