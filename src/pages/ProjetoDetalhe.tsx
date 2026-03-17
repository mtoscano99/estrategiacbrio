import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Calendar, DollarSign, Plus, Send, CheckCircle2,
  Clock, AlertTriangle, BarChart3, Sparkles, Loader2, Check, X,
  ChevronDown, Trash2, User, GripVertical, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import SWOTMatrix from "@/components/projetos/SWOTMatrix";
import AnexosProjeto from "@/components/projetos/AnexosProjeto";
import { UserAvatar } from "@/components/UserAvatar";
import NovoContatoExternoDialog from "@/components/projetos/NovoContatoExternoDialog";
import ResponsavelCombobox from "@/components/projetos/ResponsavelCombobox";
import { NovoKPIDialog } from "@/components/kpis/NovoKPIDialog";
import { NovaMedicaoDialog } from "@/components/kpis/NovaMedicaoDialog";
import { LineChart as ReLineChart, Line as ReLine, ResponsiveContainer as ReResponsive } from "recharts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

function EditableCentroCusto({ value, onSave }: { value: string; onSave: (val: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 text-xs w-32"
          placeholder="Centro de custo"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onSave(draft); setEditing(false); }}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors text-left"
    >
      {value ? `CC: ${value}` : "+ Centro de custo"}
    </button>
  );
}

function SortableEtapaItem({
  etapa,
  index,
  profiles,
  contatosExternos,
  expandedEtapa,
  setExpandedEtapa,
  updateEtapa,
  deleteEtapa,
  onAddExterno,
  onSuggestDescricao,
  suggestingDescricaoId,
}: {
  etapa: any;
  index: number;
  profiles: any[];
  contatosExternos: any[];
  expandedEtapa: string | null;
  setExpandedEtapa: (id: string | null) => void;
  updateEtapa: (id: string, field: string, value: any) => void;
  deleteEtapa: (id: string) => void;
  onAddExterno: (etapaId: string) => void;
  onSuggestDescricao: (etapaId: string, etapaNome: string) => void;
  suggestingDescricaoId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const responsavelNome = etapa.responsavel_externo_id
    ? contatosExternos.find((c: any) => c.id === etapa.responsavel_externo_id)?.nome
    : profiles.find((p: any) => p.id === etapa.responsavel_id)?.nome;

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible
        open={expandedEtapa === etapa.id}
        onOpenChange={(open) => setExpandedEtapa(open ? etapa.id : null)}
      >
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center">
            <button
              className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 p-3 pl-0 flex-1 text-left hover:bg-muted/50 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${etapa.status === "concluido" ? "bg-primary text-primary-foreground" : etapa.status === "atrasado" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                  {etapa.status === "concluido" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${etapa.status === "concluido" ? "line-through text-muted-foreground" : ""}`}>
                    {etapa.nome}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    {responsavelNome && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{responsavelNome}</span>
                    )}
                    {etapa.data_fim && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(etapa.data_fim), "dd/MM/yyyy")}</span>
                    )}
                    {Number(etapa.valor_gasto) > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />{Number(etapa.valor_gasto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    )}
                  </div>
                </div>
                <Badge variant={etapa.status === "atrasado" ? "destructive" : etapa.status === "concluido" ? "default" : "secondary"} className="text-xs shrink-0">
                  {STATUS_LABELS[etapa.status]}
                </Badge>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expandedEtapa === etapa.id ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-1 border-t space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">Descrição</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-primary hover:text-primary"
                    disabled={suggestingDescricaoId === etapa.id}
                    onClick={() => onSuggestDescricao(etapa.id, etapa.nome)}
                  >
                    {suggestingDescricaoId === etapa.id ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</>
                    ) : (
                      <><Sparkles className="h-3 w-3" /> Sugerir com IA</>
                    )}
                  </Button>
                </div>
                <Textarea
                  key={`desc-${etapa.id}-${etapa.descricao}`}
                  defaultValue={etapa.descricao || ""}
                  placeholder="Adicionar descrição..."
                  className="min-h-[60px]"
                  onBlur={(e) => { if (e.target.value !== (etapa.descricao || "")) updateEtapa(etapa.id, "descricao", e.target.value); }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
                  <Input type="date" defaultValue={etapa.data_inicio || ""} onBlur={(e) => { if (e.target.value !== (etapa.data_inicio || "")) updateEtapa(etapa.id, "data_inicio", e.target.value); }} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data Fim</label>
                  <Input type="date" defaultValue={etapa.data_fim || ""} onBlur={(e) => { if (e.target.value !== (etapa.data_fim || "")) updateEtapa(etapa.id, "data_fim", e.target.value); }} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
                  <ResponsavelCombobox
                    profiles={profiles}
                    contatosExternos={contatosExternos}
                    value={etapa.responsavel_externo_id ? `ext:${etapa.responsavel_externo_id}` : (etapa.responsavel_id || "")}
                    onValueChange={(val) => {
                      if (val === "__novo_externo__") {
                        onAddExterno(etapa.id);
                      } else if (val.startsWith("ext:")) {
                        updateEtapa(etapa.id, "responsavel_externo_id", val.replace("ext:", ""));
                        updateEtapa(etapa.id, "responsavel_id", null);
                      } else {
                        updateEtapa(etapa.id, "responsavel_id", val);
                        updateEtapa(etapa.id, "responsavel_externo_id", null);
                      }
                    }}
                    triggerClassName="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor Gasto (R$)</label>
                  <Input type="number" step="0.01" min="0" defaultValue={etapa.valor_gasto || ""} placeholder="0,00" onBlur={(e) => { const val = parseFloat(e.target.value) || 0; if (val !== (Number(etapa.valor_gasto) || 0)) updateEtapa(etapa.id, "valor_gasto", val); }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={etapa.status} onValueChange={(val) => updateEtapa(etapa.id, "status", val)}>
                    <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteEtapa(etapa.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

export default function ProjetoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const etapaRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { user, isCoordination, role, profile } = useAuth();
  const [projeto, setProjeto] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [contatosExternos, setContatosExternos] = useState<any[]>([]);
  const [showNovoContato, setShowNovoContato] = useState(false);
  const [pendingExternoEtapaId, setPendingExternoEtapaId] = useState<string | null>(null);
  const [novoComentario, setNovoComentario] = useState("");
  const [novaEtapa, setNovaEtapa] = useState({ nome: "", descricao: "", data_inicio: "", data_fim: "", responsavel_id: "", responsavel_externo_id: "", valor_gasto: "" });
  const [showAddEtapa, setShowAddEtapa] = useState(false);
  const [expandedEtapa, setExpandedEtapa] = useState<string | null>(null);

  // KPI state
  const [projetoKpis, setProjetoKpis] = useState<any[]>([]);
  const [kpiMedicoes, setKpiMedicoes] = useState<any[]>([]);
  const [kpiSuggestions, setKpiSuggestions] = useState<{ nome: string; descricao: string; unidade: string; meta: number; periodicidade: string }[]>([]);
  const [kpiSugLoading, setKpiSugLoading] = useState(false);

  // AI state
  const [showAnalise, setShowAnalise] = useState(false);
  const [analiseContent, setAnaliseContent] = useState("");
  const [analiseLoading, setAnaliseLoading] = useState(false);
  const [etapaSuggestions, setEtapaSuggestions] = useState<{ nome: string; descricao: string }[]>([]);
  const [etapaSugLoading, setEtapaSugLoading] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // Auto-expand and scroll to etapa from URL hash (e.g. #etapa-uuid)
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith("#etapa-") && etapas.length > 0) {
      const etapaId = hash.replace("#etapa-", "");
      const exists = etapas.some((e) => e.id === etapaId);
      if (exists) {
        setExpandedEtapa(etapaId);
        setTimeout(() => {
          etapaRefs.current[etapaId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    }
  }, [etapas, location.hash]);

  const loadData = async () => {
    const [projetoRes, etapasRes, comentariosRes, profilesRes, contatosRes, kpiRes, kpiMedRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome), objetivos_estrategicos(titulo)").eq("id", id).single(),
      supabase.from("etapas_projeto").select("*").eq("projeto_id", id).order("ordem"),
      supabase.from("comentarios").select("*, profiles!comentarios_autor_id_fkey(nome)").eq("projeto_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, nome, avatar_url"),
      supabase.from("contatos_externos").select("id, nome, email, cargo, organizacao"),
      supabase.from("kpis").select("id, nome, unidade, meta, periodicidade, descricao").eq("projeto_id", id),
      supabase.from("kpi_medicoes").select("id, kpi_id, valor, data_referencia, observacao"),
    ]);
    if (projetoRes.data) setProjeto(projetoRes.data);
    if (etapasRes.data) setEtapas(etapasRes.data);
    if (comentariosRes.data) setComentarios(comentariosRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (contatosRes.data) setContatosExternos(contatosRes.data);
    if (kpiRes.data) setProjetoKpis(kpiRes.data as any);
    if (kpiMedRes.data) setKpiMedicoes(kpiMedRes.data as any);
  };

  const buildProjectContext = useCallback(() => {
    if (!projeto) return null;
    const concluidas = etapas.filter((e) => e.status === "concluido").length;
    const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;

    const swotGrouped: Record<string, string[]> = { forca: [], fraqueza: [], oportunidade: [], ameaca: [] };

    return {
      nome: projeto.nome,
      descricao: projeto.descricao,
      status: STATUS_LABELS[projeto.status] || projeto.status,
      progresso,
      orcamento: projeto.orcamento_previsto,
      gasto: projeto.valor_gasto,
      dataInicio: projeto.data_inicio,
      dataFim: projeto.data_fim,
      etapas: etapas.map((e) => ({ nome: e.nome, status: STATUS_LABELS[e.status] || e.status })),
      swot: swotGrouped,
    };
  }, [projeto, etapas]);

  // --- AI Analysis (streaming) ---
  const requestAnalise = async () => {
    const ctx = buildProjectContext();
    if (!ctx) return;
    setShowAnalise(true);
    setAnaliseContent("");
    setAnaliseLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-project-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: "analise", context: ctx }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao obter análise da IA");
        setAnaliseLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setAnaliseContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error("Erro ao conectar com IA");
    } finally {
      setAnaliseLoading(false);
    }
  };

  // --- AI Etapas suggestions ---
  const suggestEtapas = async () => {
    const ctx = buildProjectContext();
    if (!ctx) return;
    setEtapaSugLoading(true);
    setEtapaSuggestions([]);

    try {
      const resp = await supabase.functions.invoke("ai-project-assistant", {
        body: { mode: "etapas", context: ctx },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) { toast.error(resp.data.error); return; }
      setEtapaSuggestions(resp.data?.suggestions || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao obter sugestões");
    } finally {
      setEtapaSugLoading(false);
    }
  };

  const acceptEtapaSuggestion = async (index: number) => {
    const s = etapaSuggestions[index];
    const { error } = await supabase.from("etapas_projeto").insert({
      projeto_id: id,
      nome: s.nome,
      descricao: s.descricao,
      ordem: etapas.length,
    });
    if (error) { toast.error("Erro ao adicionar etapa"); return; }
    setEtapaSuggestions((prev) => prev.filter((_, i) => i !== index));
    loadData();
    toast.success("Etapa adicionada");
  };

  const dismissEtapaSuggestion = (index: number) => {
    setEtapaSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  // --- AI KPI extraction ---
  const suggestKpis = async () => {
    const ctx = buildProjectContext();
    if (!ctx) return;
    setKpiSugLoading(true);
    setKpiSuggestions([]);

    try {
      const resp = await supabase.functions.invoke("ai-project-assistant", {
        body: { mode: "extract-kpis", context: { ...ctx, existingKpis: projetoKpis.map((k: any) => k.nome) } },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) { toast.error(resp.data.error); return; }
      setKpiSuggestions(resp.data?.suggestions || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao extrair KPIs");
    } finally {
      setKpiSugLoading(false);
    }
  };

  const acceptKpiSuggestion = async (index: number) => {
    const s = kpiSuggestions[index];
    const { error } = await supabase.from("kpis").insert({
      projeto_id: id,
      nome: s.nome,
      descricao: s.descricao || null,
      unidade: s.unidade || "%",
      meta: s.meta || 0,
      periodicidade: s.periodicidade || "mensal",
      criado_por: user?.id || null,
    } as any);
    if (error) { toast.error("Erro ao criar KPI"); return; }
    setKpiSuggestions((prev) => prev.filter((_, i) => i !== index));
    loadData();
    toast.success("KPI adicionado");
  };

  const dismissKpiSuggestion = (index: number) => {
    setKpiSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Existing handlers ---
  const addEtapa = async () => {
    if (!novaEtapa.nome.trim()) return;
    const { error } = await supabase.from("etapas_projeto").insert({
      projeto_id: id,
      nome: novaEtapa.nome,
      descricao: novaEtapa.descricao || null,
      data_inicio: novaEtapa.data_inicio || null,
      data_fim: novaEtapa.data_fim || null,
      responsavel_id: novaEtapa.responsavel_externo_id ? null : (novaEtapa.responsavel_id || null),
      responsavel_externo_id: novaEtapa.responsavel_externo_id || null,
      valor_gasto: parseFloat(novaEtapa.valor_gasto) || 0,
      ordem: etapas.length,
    } as any);
    if (error) { toast.error("Erro ao adicionar etapa"); return; }
    setNovaEtapa({ nome: "", descricao: "", data_inicio: "", data_fim: "", responsavel_id: "", responsavel_externo_id: "", valor_gasto: "" });
    setShowAddEtapa(false);
    loadData();
    toast.success("Etapa adicionada");
  };

  const updateEtapa = async (etapaId: string, field: string, value: any) => {
    const { error } = await supabase.from("etapas_projeto").update({ [field]: value || null } as any).eq("id", etapaId);
    if (error) { toast.error("Erro ao atualizar etapa"); return; }
    loadData();
  };

  const deleteEtapa = async (etapaId: string) => {
    const { error } = await supabase.from("etapas_projeto").delete().eq("id", etapaId);
    if (error) { toast.error("Erro ao excluir etapa"); return; }
    loadData();
    toast.success("Etapa excluída");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = etapas.findIndex((e) => e.id === active.id);
    const newIndex = etapas.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(etapas, oldIndex, newIndex);
    setEtapas(reordered);

    // Persist new order
    await Promise.all(
      reordered.map((e, i) =>
        supabase.from("etapas_projeto").update({ ordem: i } as any).eq("id", e.id)
      )
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const addComentario = async () => {
    if (!novoComentario.trim() || !user) return;
    const { error } = await supabase.from("comentarios").insert({
      projeto_id: id,
      autor_id: user.id,
      conteudo: novoComentario,
    });
    if (error) { toast.error("Erro ao adicionar comentário"); return; }

    // Notificar responsável do projeto (se diferente do autor)
    if (projeto?.responsavel_id && projeto.responsavel_id !== user.id) {
      await supabase.from("notificacoes").insert({
        usuario_id: projeto.responsavel_id,
        tipo: "comentario",
        titulo: `Novo comentário em "${projeto.nome}"`,
        mensagem: novoComentario.slice(0, 120),
        link: `/projetos/${id}`,
      } as any);
    }

    setNovoComentario("");
    loadData();
  };

  if (!projeto) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  const concluidas = etapas.filter((e) => e.status === "concluido").length;
  const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;
  const orcamento = Number(projeto.orcamento_previsto) || 0;
  const gasto = Number(projeto.valor_gasto) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{projeto.nome}</h1>
          <p className="text-muted-foreground text-sm">{projeto.areas_estrategicas?.nome}</p>
          {/* Responsável macro do projeto */}
          {(isCoordination || projeto.responsavel_id === user?.id) ? (
            <div className="mt-1.5 max-w-[260px]">
              <ResponsavelCombobox
                profiles={profiles}
                contatosExternos={contatosExternos}
                value={
                  projeto.responsavel_externo_id
                    ? `ext:${projeto.responsavel_externo_id}`
                    : (projeto.responsavel_id || "")
                }
                onValueChange={async (val) => {
                  if (val === "__novo_externo__") {
                    setPendingExternoEtapaId("__projeto__");
                    setShowNovoContato(true);
                    return;
                  }
                  let updateData: any = {};
                  if (val.startsWith("ext:")) {
                    updateData = { responsavel_externo_id: val.replace("ext:", ""), responsavel_id: null };
                  } else {
                    updateData = { responsavel_id: val, responsavel_externo_id: null };
                  }
                  const { error } = await supabase.from("projetos").update(updateData).eq("id", id);
                  if (error) { toast.error("Erro ao atualizar responsável"); return; }
                  setProjeto((prev: any) => prev ? { ...prev, ...updateData } : prev);
                  toast.success("Responsável atualizado");
                }}
                placeholder="Atribuir responsável"
                triggerClassName="h-8 text-xs"
                showAddExterno
              />
            </div>
          ) : (
            (() => {
              const respNome = projeto.responsavel_externo_id
                ? contatosExternos.find((c: any) => c.id === projeto.responsavel_externo_id)?.nome
                : profiles.find((p: any) => p.id === projeto.responsavel_id)?.nome;
              const respAvatar = !projeto.responsavel_externo_id
                ? profiles.find((p: any) => p.id === projeto.responsavel_id)?.avatar_url
                : null;
              return respNome ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <UserAvatar avatarUrl={respAvatar} nome={respNome} className="h-5 w-5" />
                  <span className="text-xs text-muted-foreground">{respNome}</span>
                  {projeto.responsavel_externo_id && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1">Externo</Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground mt-1.5 block">Sem responsável</span>
              );
            })()
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={requestAnalise}>
          <Sparkles className="h-4 w-4" /> Sugestões IA
        </Button>
        {isCoordination && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o projeto "{projeto.nome}"? Esta ação não pode ser desfeita e removerá todas as etapas, comentários e anexos associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    const { error } = await supabase.from("projetos").delete().eq("id", id);
                    if (error) { toast.error("Erro ao excluir projeto"); return; }
                    toast.success("Projeto excluído");
                    navigate("/projetos");
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {(isCoordination || projeto.responsavel_id === user?.id) ? (
          <Select
            value={projeto.status}
            onValueChange={async (val) => {
              const { error } = await supabase.from("projetos").update({ status: val as any }).eq("id", id);
              if (error) { toast.error("Erro ao atualizar status"); return; }
              setProjeto((prev: any) => ({ ...prev, status: val }));
              toast.success("Status atualizado");
            }}
          >
            <SelectTrigger className={`w-[160px] h-8 text-xs font-semibold ${projeto.status === "atrasado" ? "border-destructive text-destructive" : projeto.status === "concluido" ? "border-primary text-primary" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={projeto.status === "atrasado" ? "destructive" : "default"}>
            {STATUS_LABELS[projeto.status]}
          </Badge>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold">{progresso}%</p>
              </div>
            </div>
            <Progress value={progresso} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Orçamento Previsto</p>
                <p className="text-lg font-bold">{orcamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                <EditableCentroCusto
                  value={(projeto as any).centro_custo ?? ""}
                  onSave={async (val) => {
                    const { error } = await supabase
                      .from("projetos")
                      .update({ centro_custo: val || null })
                      .eq("id", projeto!.id);
                    if (error) {
                      toast.error("Erro ao salvar centro de custo");
                    } else {
                      setProjeto((prev: any) => prev ? { ...prev, centro_custo: val || null } : prev);
                      toast.success("Centro de custo atualizado");
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Realizado</p>
                <p className="text-lg font-bold">{gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                {orcamento > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground">{Math.round((gasto / orcamento) * 100)}% do orçamento</p>
                    <Progress value={Math.min((gasto / orcamento) * 100, 100)} className="mt-2 h-2" />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-sm font-medium">
                  {projeto.data_inicio ? format(new Date(projeto.data_inicio), "dd/MM/yyyy") : "–"} →{" "}
                  {projeto.data_fim ? format(new Date(projeto.data_fim), "dd/MM/yyyy") : "–"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Gastos por Etapa */}
      {(() => {
        const etapasComGasto = etapas.filter((e) => Number(e.valor_gasto) > 0);
        const chartData = etapasComGasto.map((e) => ({ nome: e.nome, valor: Number(e.valor_gasto) }));
        const chartHeight = Math.max(200, etapasComGasto.length * 50);
        const chartConfig: ChartConfig = {
          valor: { label: "Valor Gasto", color: "hsl(var(--primary))" },
        };

        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gastos por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight, aspectRatio: "unset" }}>
                  <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" })}
                      className="text-xs"
                    />
                    <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Valor Gasto"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                    />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum gasto registrado nas etapas.</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader><CardTitle className="text-lg">Descrição</CardTitle></CardHeader>
        <CardContent>
          {(isCoordination || (role === "lider_area" && projeto.area_id === profile?.area_id)) ? (
            <Textarea
              defaultValue={projeto.descricao || ""}
              placeholder="Adicionar descrição..."
              className="min-h-[100px] text-sm"
              onBlur={async (e) => {
                const newValue = e.target.value.trim();
                if (newValue === (projeto.descricao || "").trim()) return;
                const { error } = await supabase
                  .from("projetos")
                  .update({ descricao: newValue || null })
                  .eq("id", id!);
                if (error) {
                  toast.error("Erro ao salvar descrição");
                } else {
                  setProjeto((prev: any) => prev ? { ...prev, descricao: newValue || null } : prev);
                  toast.success("Descrição salva");
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {projeto.descricao || "Sem descrição"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Anexos */}
      <AnexosProjeto projetoId={id!} />

      {/* Análise SWOT */}
      <SWOTMatrix projetoId={id!} projectContext={buildProjectContext()} />

      {/* Etapas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Etapas / Marcos</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={suggestEtapas} disabled={etapaSugLoading}>
              {etapaSugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Sugerir Etapas
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddEtapa(!showAddEtapa)}>
              <Plus className="h-4 w-4 mr-1" /> Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddEtapa && (
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <Input placeholder="Nome da etapa" value={novaEtapa.nome} onChange={(e) => setNovaEtapa({ ...novaEtapa, nome: e.target.value })} />
              <Textarea placeholder="Descrição (opcional)" value={novaEtapa.descricao} onChange={(e) => setNovaEtapa({ ...novaEtapa, descricao: e.target.value })} className="min-h-[60px]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Início</label>
                  <Input type="date" value={novaEtapa.data_inicio} onChange={(e) => setNovaEtapa({ ...novaEtapa, data_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
                  <Input type="date" value={novaEtapa.data_fim} onChange={(e) => setNovaEtapa({ ...novaEtapa, data_fim: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
                  <ResponsavelCombobox
                    profiles={profiles}
                    contatosExternos={contatosExternos}
                    value={novaEtapa.responsavel_externo_id ? `ext:${novaEtapa.responsavel_externo_id}` : novaEtapa.responsavel_id}
                    onValueChange={(val) => {
                      if (val === "__novo_externo__") {
                        setPendingExternoEtapaId("__new__");
                        setShowNovoContato(true);
                      } else if (val.startsWith("ext:")) {
                        setNovaEtapa({ ...novaEtapa, responsavel_id: "", responsavel_externo_id: val.replace("ext:", "") });
                      } else {
                        setNovaEtapa({ ...novaEtapa, responsavel_id: val, responsavel_externo_id: "" });
                      }
                    }}
                    triggerClassName="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor Gasto (R$)</label>
                  <Input type="number" step="0.01" min="0" value={novaEtapa.valor_gasto} onChange={(e) => setNovaEtapa({ ...novaEtapa, valor_gasto: e.target.value })} placeholder="0,00" />
                </div>
              </div>
              <Button size="sm" onClick={addEtapa}>Adicionar</Button>
            </div>
          )}

          {/* AI Etapa Suggestions */}
          {etapaSuggestions.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" /> Sugestões da IA
              </p>
              {etapaSuggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-background/60">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">{s.descricao}</p>
                  </div>
                  <button onClick={() => acceptEtapaSuggestion(i)} className="text-primary hover:text-primary/80 shrink-0">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => dismissEtapaSuggestion(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {etapas.length === 0 && etapaSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma etapa cadastrada</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={etapas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                {etapas.map((etapa, i) => (
                  <div key={etapa.id} ref={(el) => { etapaRefs.current[etapa.id] = el; }}>
                    <SortableEtapaItem
                      etapa={etapa}
                      index={i}
                      profiles={profiles}
                      contatosExternos={contatosExternos}
                      expandedEtapa={expandedEtapa}
                      setExpandedEtapa={setExpandedEtapa}
                      updateEtapa={updateEtapa}
                      deleteEtapa={deleteEtapa}
                      onAddExterno={(etapaId) => { setPendingExternoEtapaId(etapaId); setShowNovoContato(true); }}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* KPIs do Projeto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Indicadores (KPIs)</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={suggestKpis} disabled={kpiSugLoading}>
              {kpiSugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Extrair KPIs com IA
            </Button>
            <NovoKPIDialog
              onCreated={loadData}
              prefill={{ projeto_id: id }}
              trigger={<Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> KPI</Button>}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* AI KPI Suggestions */}
          {kpiSuggestions.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" /> Sugestões de KPIs da IA
              </p>
              {kpiSuggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-background/60">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">{s.descricao} · Meta: {s.meta} {s.unidade} · {s.periodicidade}</p>
                  </div>
                  <button onClick={() => acceptKpiSuggestion(i)} className="text-primary hover:text-primary/80 shrink-0">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => dismissKpiSuggestion(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {projetoKpis.length === 0 && kpiSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum KPI vinculado a este projeto</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projetoKpis.map((kpi: any) => {
                const meds = kpiMedicoes.filter((m: any) => m.kpi_id === kpi.id).sort((a: any, b: any) => a.data_referencia.localeCompare(b.data_referencia));
                const lastVal = meds.length > 0 ? meds[meds.length - 1].valor : null;
                const progress = kpi.meta > 0 && lastVal !== null ? Math.min((lastVal / kpi.meta) * 100, 100) : 0;
                const sparkData = meds.slice(-6).map((m: any) => ({ v: m.valor }));

                return (
                  <div
                    key={kpi.id}
                    className="rounded-lg border bg-card p-4 space-y-2 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/kpis/${kpi.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{kpi.nome}</p>
                        <p className="text-xs text-muted-foreground">Meta: {kpi.meta} {kpi.unidade}</p>
                      </div>
                      <Badge variant={lastVal === null ? "secondary" : lastVal >= kpi.meta ? "default" : "destructive"} className="text-xs">
                        {lastVal === null ? "Sem dados" : lastVal >= kpi.meta ? "No alvo" : "Abaixo"}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-xl font-bold">{lastVal !== null ? lastVal : "—"} <span className="text-xs font-normal text-muted-foreground">{kpi.unidade}</span></p>
                      {sparkData.length > 1 && (
                        <div className="w-16 h-6">
                          <ReResponsive width="100%" height="100%">
                            <ReLineChart data={sparkData}>
                              <ReLine type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                            </ReLineChart>
                          </ReResponsive>
                        </div>
                      )}
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <NovaMedicaoDialog kpiId={kpi.id} kpiNome={kpi.nome} unidade={kpi.unidade} onCreated={loadData} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Comentários</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea placeholder="Adicionar comentário..." value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} className="min-h-[60px]" />
            <Button size="icon" onClick={addComentario} disabled={!novoComentario.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          {comentarios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhum comentário</p>
          ) : (
            comentarios.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.profiles?.nome || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.conteudo}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={showAnalise} onOpenChange={setShowAnalise}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Análise IA do Projeto
            </DialogTitle>
          </DialogHeader>
          {analiseLoading && !analiseContent && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Analisando projeto...
            </div>
          )}
          {analiseContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{analiseContent}</ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* External Contact Dialog */}
      <NovoContatoExternoDialog
        open={showNovoContato}
        onOpenChange={setShowNovoContato}
        onCreated={async (contato) => {
          setContatosExternos((prev) => [...prev, contato]);
          if (pendingExternoEtapaId === "__projeto__") {
            // Atualizar responsável macro do projeto
            const updateData = { responsavel_externo_id: contato.id, responsavel_id: null };
            const { error } = await supabase.from("projetos").update(updateData).eq("id", id);
            if (error) { toast.error("Erro ao atualizar responsável"); } else {
              setProjeto((prev: any) => prev ? { ...prev, ...updateData } : prev);
              toast.success("Responsável atualizado");
            }
          } else if (pendingExternoEtapaId === "__new__") {
            setNovaEtapa({ ...novaEtapa, responsavel_id: "", responsavel_externo_id: contato.id });
          } else if (pendingExternoEtapaId) {
            updateEtapa(pendingExternoEtapaId, "responsavel_externo_id", contato.id);
            updateEtapa(pendingExternoEtapaId, "responsavel_id", null);
          }
          setPendingExternoEtapaId(null);
        }}
      />
    </div>
  );
}
