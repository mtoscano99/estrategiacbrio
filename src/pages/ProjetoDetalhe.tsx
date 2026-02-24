import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowLeft, Calendar, DollarSign, Plus, Send, CheckCircle2,
  Clock, AlertTriangle, BarChart3, Sparkles, Loader2, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import SWOTMatrix from "@/components/projetos/SWOTMatrix";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export default function ProjetoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isCoordination } = useAuth();
  const [projeto, setProjeto] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [novaEtapa, setNovaEtapa] = useState({ nome: "", descricao: "" });
  const [showAddEtapa, setShowAddEtapa] = useState(false);

  // AI state
  const [showAnalise, setShowAnalise] = useState(false);
  const [analiseContent, setAnaliseContent] = useState("");
  const [analiseLoading, setAnaliseLoading] = useState(false);
  const [etapaSuggestions, setEtapaSuggestions] = useState<{ nome: string; descricao: string }[]>([]);
  const [etapaSugLoading, setEtapaSugLoading] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    const [projetoRes, etapasRes, comentariosRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome), objetivos_estrategicos(titulo)").eq("id", id).single(),
      supabase.from("etapas_projeto").select("*").eq("projeto_id", id).order("ordem"),
      supabase.from("comentarios").select("*, profiles!comentarios_autor_id_fkey(nome)").eq("projeto_id", id).order("created_at", { ascending: false }),
    ]);
    if (projetoRes.data) setProjeto(projetoRes.data);
    if (etapasRes.data) setEtapas(etapasRes.data);
    if (comentariosRes.data) setComentarios(comentariosRes.data);
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

  // --- Existing handlers ---
  const addEtapa = async () => {
    if (!novaEtapa.nome.trim()) return;
    const { error } = await supabase.from("etapas_projeto").insert({
      projeto_id: id,
      nome: novaEtapa.nome,
      descricao: novaEtapa.descricao,
      ordem: etapas.length,
    });
    if (error) { toast.error("Erro ao adicionar etapa"); return; }
    setNovaEtapa({ nome: "", descricao: "" });
    setShowAddEtapa(false);
    loadData();
    toast.success("Etapa adicionada");
  };

  const updateEtapaStatus = async (etapaId: string, status: string) => {
    await supabase.from("etapas_projeto").update({ status: status as any }).eq("id", etapaId);
    loadData();
  };

  const addComentario = async () => {
    if (!novoComentario.trim() || !user) return;
    const { error } = await supabase.from("comentarios").insert({
      projeto_id: id,
      autor_id: user.id,
      conteudo: novoComentario,
    });
    if (error) { toast.error("Erro ao adicionar comentário"); return; }
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
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={requestAnalise}>
          <Sparkles className="h-4 w-4" /> Sugestões IA
        </Button>
        <Badge variant={projeto.status === "atrasado" ? "destructive" : "default"}>
          {STATUS_LABELS[projeto.status]}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
              <DollarSign className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Orçamento</p>
                <p className="text-lg font-bold">{orcamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                <p className="text-xs text-muted-foreground">Gasto: {gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
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

      {/* Description */}
      {projeto.descricao && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Descrição</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{projeto.descricao}</p></CardContent>
        </Card>
      )}

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
            <div className="flex gap-2 p-3 rounded-lg bg-muted">
              <Input placeholder="Nome da etapa" value={novaEtapa.nome} onChange={(e) => setNovaEtapa({ ...novaEtapa, nome: e.target.value })} />
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
                  <button onClick={() => acceptEtapaSuggestion(i)} className="text-emerald-600 hover:text-emerald-700 shrink-0">
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
            etapas.map((etapa, i) => (
              <div key={etapa.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${etapa.status === "concluido" ? "bg-success text-success-foreground" : etapa.status === "atrasado" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                    {etapa.status === "concluido" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${etapa.status === "concluido" ? "line-through text-muted-foreground" : ""}`}>
                    {etapa.nome}
                  </span>
                </div>
                <Select value={etapa.status} onValueChange={(val) => updateEtapaStatus(etapa.id, val)}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
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
    </div>
  );
}
