import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FilePlus, Upload, Loader2, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

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

export default function NovoProjeto() {
  const navigate = useNavigate();
  const { user, isCoordination } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extractedEtapas, setExtractedEtapas] = useState<ExtractedEtapa[]>([]);
  const [extractedSwot, setExtractedSwot] = useState<ExtractedSwot>({});

  const [form, setForm] = useState({
    titulo: "",
    justificativa: "",
    objetivo_id: "",
    area_id: "",
    responsavel_id: "",
    data_inicio: "",
    data_fim: "",
    estimativa_prazo: "",
    estimativa_orcamento: "",
    entregas_esperadas: "",
    centro_custo: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("areas_estrategicas").select("id, nome"),
      supabase.from("objetivos_estrategicos").select("id, titulo, ano"),
      supabase.from("profiles").select("id, nome, avatar_url"),
    ]).then(([areasRes, objRes, profilesRes]) => {
      if (areasRes.data) setAreas(areasRes.data);
      if (objRes.data) setObjetivos(objRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    });
  }, []);

  const processFile = async (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
      "text/plain",
    ];
    const isAllowed = allowedTypes.includes(file.type) || file.name.endsWith(".docx") || file.name.endsWith(".pdf") || file.name.endsWith(".txt");

    if (!isAllowed) {
      toast.error("Formato não suportado. Envie um arquivo DOCX, PDF ou TXT.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-project-doc`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro ao processar documento" }));
        throw new Error(err.error || "Erro ao processar documento");
      }

      const data = await response.json();

      setForm((prev) => ({
        ...prev,
        titulo: data.nome || prev.titulo,
        justificativa: data.descricao || prev.justificativa,
        data_inicio: data.data_inicio || prev.data_inicio,
        data_fim: data.data_fim || prev.data_fim,
        estimativa_orcamento: data.orcamento_previsto ? String(data.orcamento_previsto) : prev.estimativa_orcamento,
        centro_custo: data.centro_custo || prev.centro_custo,
        estimativa_prazo: data.estimativa_prazo || prev.estimativa_prazo,
        entregas_esperadas: data.entregas_esperadas || prev.entregas_esperadas,
      }));

      if (data.etapas?.length) setExtractedEtapas(data.etapas);
      if (data.swot) setExtractedSwot(data.swot);

      const extras: string[] = [];
      if (data.etapas?.length) extras.push(`${data.etapas.length} etapas`);
      const swotCount = Object.values(data.swot || {}).reduce<number>((a, b: any) => a + (b?.length || 0), 0);
      if (swotCount > 0) extras.push(`${swotCount} itens SWOT`);

      toast.success(
        `Dados extraídos com sucesso!${extras.length ? ` (${extras.join(", ")})` : ""} Revise e confirme.`
      );
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar documento");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isCoordination) {
        const { data: projeto, error } = await supabase.from("projetos").insert({
          nome: form.titulo,
          descricao: form.justificativa,
          area_id: form.area_id || null,
          objetivo_id: form.objetivo_id || null,
          responsavel_id: form.responsavel_id || user.id,
          data_inicio: form.data_inicio || null,
          data_fim: form.data_fim || null,
          orcamento_previsto: form.estimativa_orcamento ? Number(form.estimativa_orcamento) : 0,
          centro_custo: form.centro_custo || null,
        } as any).select("id").single();
        if (error) throw error;

        const projetoId = projeto.id;

        // Insert extracted etapas
        if (extractedEtapas.length > 0) {
          const etapasToInsert = extractedEtapas.map((et, i) => ({
            projeto_id: projetoId,
            nome: et.nome,
            descricao: et.descricao || null,
            data_inicio: et.data_inicio || null,
            data_fim: et.data_fim || null,
            ordem: i,
          }));
          const { error: etErr } = await supabase.from("etapas_projeto").insert(etapasToInsert as any);
          if (etErr) console.error("Erro ao inserir etapas:", etErr);
        }

        // Insert extracted SWOT items
        const swotItems: { projeto_id: string; tipo: string; descricao: string; criado_por: string }[] = [];
        const tipoMap: Record<string, string> = {
          forca: "forca",
          fraqueza: "fraqueza",
          oportunidade: "oportunidade",
          ameaca: "ameaca",
        };
        for (const [key, items] of Object.entries(extractedSwot)) {
          if (items && Array.isArray(items)) {
            for (const desc of items) {
              swotItems.push({
                projeto_id: projetoId,
                tipo: tipoMap[key] || key,
                descricao: desc,
                criado_por: user.id,
              });
            }
          }
        }
        if (swotItems.length > 0) {
          const { error: swotErr } = await supabase.from("swot_items").insert(swotItems as any);
          if (swotErr) console.error("Erro ao inserir SWOT:", swotErr);
        }

        toast.success("Projeto criado com sucesso!");
        navigate(`/projetos/${projetoId}`);
      } else {
        const { error } = await supabase.from("propostas_projeto").insert({
          titulo: form.titulo,
          justificativa: form.justificativa,
          objetivo_id: form.objetivo_id || null,
          area_id: form.area_id || null,
          proponente_id: user.id,
          estimativa_prazo: form.estimativa_prazo,
          estimativa_orcamento: form.estimativa_orcamento ? Number(form.estimativa_orcamento) : null,
          entregas_esperadas: form.entregas_esperadas,
        });
        if (error) throw error;
        toast.success("Proposta enviada para aprovação!");
        navigate("/projetos");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Drop zone overlay */}
      <div
        className={`relative mb-6 rounded-xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        } ${importing ? "pointer-events-none opacity-60" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FilePlus className="h-6 w-6 text-primary" />
              {isCoordination ? "Novo Projeto" : "Propor Projeto"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCoordination ? "Crie um novo projeto diretamente no portfólio" : "Submeta uma proposta de projeto para aprovação da coordenação"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt"
              className="hidden"
              onChange={handleImportDocument}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar de Documento
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">ou arraste um arquivo aqui</p>
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

      {/* Editable extracted etapas */}
      {extractedEtapas.length > 0 && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-primary">📋 Etapas extraídas ({extractedEtapas.length})</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive text-xs"
                onClick={() => setExtractedEtapas([])}
              >
                Remover todas
              </Button>
            </div>
            <div className="space-y-2">
              {extractedEtapas.map((etapa, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-2 shrink-0 w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={etapa.nome}
                        onChange={(e) => {
                          const updated = [...extractedEtapas];
                          updated[idx] = { ...updated[idx], nome: e.target.value };
                          setExtractedEtapas(updated);
                        }}
                        placeholder="Nome da etapa"
                        className="h-8 text-sm font-medium"
                      />
                      <Textarea
                        value={etapa.descricao || ""}
                        onChange={(e) => {
                          const updated = [...extractedEtapas];
                          updated[idx] = { ...updated[idx], descricao: e.target.value };
                          setExtractedEtapas(updated);
                        }}
                        placeholder="Descrição da etapa..."
                        className="min-h-[40px] text-sm"
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Início</Label>
                          <Input
                            type="date"
                            value={etapa.data_inicio || ""}
                            onChange={(e) => {
                              const updated = [...extractedEtapas];
                              updated[idx] = { ...updated[idx], data_inicio: e.target.value };
                              setExtractedEtapas(updated);
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fim</Label>
                          <Input
                            type="date"
                            value={etapa.data_fim || ""}
                            onChange={(e) => {
                              const updated = [...extractedEtapas];
                              updated[idx] = { ...updated[idx], data_fim: e.target.value };
                              setExtractedEtapas(updated);
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => {
                          const updated = [...extractedEtapas];
                          [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                          setExtractedEtapas(updated);
                        }}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === extractedEtapas.length - 1}
                        onClick={() => {
                          const updated = [...extractedEtapas];
                          [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                          setExtractedEtapas(updated);
                        }}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setExtractedEtapas((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SWOT summary */}
      {Object.values(extractedSwot).some((v) => v && v.length > 0) && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-medium text-primary mb-2">Dados SWOT extraídos:</p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {(extractedSwot.forca?.length ?? 0) > 0 && (
                <span className="bg-background rounded px-2 py-1">💪 {extractedSwot.forca!.length} forças</span>
              )}
              {(extractedSwot.fraqueza?.length ?? 0) > 0 && (
                <span className="bg-background rounded px-2 py-1">⚠️ {extractedSwot.fraqueza!.length} fraquezas</span>
              )}
              {(extractedSwot.oportunidade?.length ?? 0) > 0 && (
                <span className="bg-background rounded px-2 py-1">🎯 {extractedSwot.oportunidade!.length} oportunidades</span>
              )}
              {(extractedSwot.ameaca?.length ?? 0) > 0 && (
                <span className="bg-background rounded px-2 py-1">🔴 {extractedSwot.ameaca!.length} ameaças</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Estes dados serão salvos automaticamente ao criar o projeto.</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1 - Informações Gerais */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título do Projeto *</Label>
                  <Input id="titulo" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} placeholder="Nome do projeto" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justificativa">{isCoordination ? "Descrição" : "Justificativa"} *</Label>
                  <Textarea id="justificativa" value={form.justificativa} onChange={(e) => update("justificativa", e.target.value)} placeholder="Descreva o projeto e sua justificativa..." required rows={4} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Área Estratégica</Label>
                    <Select value={form.area_id} onValueChange={(v) => update("area_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo Estratégico</Label>
                    <Select value={form.objetivo_id} onValueChange={(v) => update("objetivo_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {objetivos.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.titulo} ({o.ano})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção 2 - Planejamento */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Planejamento</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    {isCoordination ? (
                      <Select value={form.responsavel_id} onValueChange={(v) => update("responsavel_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <UserAvatar avatarUrl={p.avatar_url} nome={p.nome} className="h-5 w-5" />
                                <span>{p.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value="Você (proponente)" disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo">Estimativa de Prazo</Label>
                    <Input id="prazo" value={form.estimativa_prazo} onChange={(e) => update("estimativa_prazo", e.target.value)} placeholder="Ex: 6 meses" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input id="data_inicio" type="date" value={form.data_inicio} onChange={(e) => update("data_inicio", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim</Label>
                    <Input id="data_fim" type="date" value={form.data_fim} onChange={(e) => update("data_fim", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção 3 - Financeiro */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Financeiro</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orcamento">Orçamento Previsto (R$)</Label>
                  <Input id="orcamento" type="number" value={form.estimativa_orcamento} onChange={(e) => update("estimativa_orcamento", e.target.value)} placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centro_custo">Centro de Custo</Label>
                  <Input id="centro_custo" value={form.centro_custo} onChange={(e) => update("centro_custo", e.target.value)} placeholder="Ex: CC-001" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção 4 - Entregas */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Entregas</h2>
              <div className="space-y-2">
                <Label htmlFor="entregas">Entregas Esperadas</Label>
                <Textarea id="entregas" value={form.entregas_esperadas} onChange={(e) => update("entregas_esperadas", e.target.value)} placeholder="Liste as entregas esperadas do projeto..." rows={3} />
              </div>
            </div>

            <Separator />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : isCoordination ? "Criar Projeto" : "Enviar Proposta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
