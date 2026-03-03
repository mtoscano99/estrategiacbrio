import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectDocx, type DocxProjectData, type DocxEtapa, type DocxSwotItems, type DocxKPI, type DocxAIContent } from "@/lib/docxGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileBarChart, Download, Printer, CircleDot, CheckCircle2, Clock, AlertTriangle, XCircle, Calendar, Target, Users, DollarSign, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const SAUDE_LABELS: Record<string, string> = {
  no_prazo: "No Prazo",
  atencao: "Atenção",
  atrasado: "Atrasado",
};

const STATUS_COLORS: Record<string, string> = {
  nao_iniciado: "bg-muted text-muted-foreground",
  em_andamento: "bg-primary text-primary-foreground",
  concluido: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]",
  atrasado: "bg-destructive text-destructive-foreground",
  cancelado: "bg-muted text-muted-foreground line-through",
};

const SAUDE_COLORS: Record<string, string> = {
  no_prazo: "text-[hsl(var(--success))]",
  atencao: "text-[hsl(var(--warning))]",
  atrasado: "text-destructive",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  nao_iniciado: <CircleDot className="h-4 w-4" />,
  em_andamento: <Clock className="h-4 w-4" />,
  concluido: <CheckCircle2 className="h-4 w-4" />,
  atrasado: <AlertTriangle className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return "–";
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
};

const hoje = new Date();
const dataGeracao = format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

export default function Relatorios() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [selectedProjeto, setSelectedProjeto] = useState("");
  const [projetoData, setProjetoData] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);

  // Portfolio state
  const [portfolioProjetos, setPortfolioProjetos] = useState<any[]>([]);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);

  useEffect(() => {
    supabase.from("projetos").select("id, nome").order("nome").then(({ data }) => {
      if (data) setProjetos(data);
    });
  }, []);

  const loadReport = async (projetoId: string) => {
    setSelectedProjeto(projetoId);
    const [projetoRes, etapasRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome), objetivos_estrategicos(titulo)").eq("id", projetoId).single(),
      supabase.from("etapas_projeto").select("id, nome, descricao, data_inicio, data_fim, status, ordem, valor_gasto, responsavel_id, responsavel_externo_id").eq("projeto_id", projetoId).order("ordem"),
    ]);
    if (projetoRes.data) {
      // Also resolve external responsavel for the project
      const proj = projetoRes.data as any;
      if (proj.responsavel_externo_id && !proj.profiles?.nome) {
        const { data: extData } = await supabase.from("contatos_externos").select("nome").eq("id", proj.responsavel_externo_id).single();
        if (extData) proj.profiles = { nome: extData.nome };
      }
      setProjetoData(proj);
    }
    if (etapasRes.data) {
      // Fetch responsible names separately to avoid RLS join issues on profiles
      const responsavelIds = [...new Set(etapasRes.data.map((e: any) => e.responsavel_id).filter(Boolean))];
      const externoIds = [...new Set(etapasRes.data.map((e: any) => e.responsavel_externo_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      let externosMap: Record<string, string> = {};
      if (responsavelIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", responsavelIds);
        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map((p: any) => [p.id, p.nome]));
        }
      }
      if (externoIds.length > 0) {
        const { data: extData } = await supabase
          .from("contatos_externos")
          .select("id, nome")
          .in("id", externoIds);
        if (extData) {
          externosMap = Object.fromEntries(extData.map((c: any) => [c.id, c.nome]));
        }
      }
      setEtapas(etapasRes.data.map((e: any) => ({
        ...e,
        responsavel_nome: e.responsavel_externo_id
          ? (externosMap[e.responsavel_externo_id] || "Externo")
          : e.responsavel_id ? (profilesMap[e.responsavel_id] || "–") : "–",
      })));
    }
  };

  const loadPortfolio = async () => {
    if (portfolioLoaded) return;
    const { data } = await supabase
      .from("projetos")
      .select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome)")
      .order("nome");
    if (data) {
      setPortfolioProjetos(data);
      setPortfolioLoaded(true);
    }
  };

  const [generatingDocx, setGeneratingDocx] = useState(false);

  const handlePrint = () => {
    window.print();
    toast.success("Relatório enviado para impressão");
  };

  const handleGenerateDocx = useCallback(async () => {
    if (!projetoData || !selectedProjeto) return;
    setGeneratingDocx(true);
    toast.info("Gerando documento DOCX... A IA está complementando as informações.");

    try {
      // Fetch SWOT items
      const { data: swotData } = await supabase
        .from("swot_items")
        .select("tipo, descricao")
        .eq("projeto_id", selectedProjeto);

      const swot: DocxSwotItems = { forca: [], fraqueza: [], oportunidade: [], ameaca: [] };
      swotData?.forEach((item: any) => {
        if (swot[item.tipo as keyof DocxSwotItems]) {
          swot[item.tipo as keyof DocxSwotItems].push(item.descricao);
        }
      });

      // Fetch KPIs linked to the project's objective
      let kpiList: DocxKPI[] = [];
      if (projetoData.objetivo_id) {
        const { data: kpisData } = await supabase
          .from("kpis")
          .select("id, nome, unidade, meta, periodicidade")
          .eq("objetivo_id", projetoData.objetivo_id);

        if (kpisData && kpisData.length > 0) {
          const kpiIds = kpisData.map((k: any) => k.id);
          const { data: medicoesData } = await supabase
            .from("kpi_medicoes")
            .select("kpi_id, valor, data_referencia")
            .in("kpi_id", kpiIds)
            .order("data_referencia", { ascending: false });

          const lastValues: Record<string, number> = {};
          medicoesData?.forEach((m: any) => {
            if (!lastValues[m.kpi_id]) lastValues[m.kpi_id] = m.valor;
          });

          kpiList = kpisData.map((k: any) => ({
            nome: k.nome,
            unidade: k.unidade,
            meta: k.meta,
            periodicidade: k.periodicidade,
            ultimo_valor: lastValues[k.id] ?? null,
          }));
        }
      }

      // Also try KPIs by area
      if (kpiList.length === 0 && projetoData.area_id) {
        const { data: kpisArea } = await supabase
          .from("kpis")
          .select("id, nome, unidade, meta, periodicidade")
          .eq("area_id", projetoData.area_id);

        if (kpisArea && kpisArea.length > 0) {
          const kpiIds = kpisArea.map((k: any) => k.id);
          const { data: medicoesData } = await supabase
            .from("kpi_medicoes")
            .select("kpi_id, valor, data_referencia")
            .in("kpi_id", kpiIds)
            .order("data_referencia", { ascending: false });

          const lastValues: Record<string, number> = {};
          medicoesData?.forEach((m: any) => {
            if (!lastValues[m.kpi_id]) lastValues[m.kpi_id] = m.valor;
          });

          kpiList = kpisArea.map((k: any) => ({
            nome: k.nome,
            unidade: k.unidade,
            meta: k.meta,
            periodicidade: k.periodicidade,
            ultimo_valor: lastValues[k.id] ?? null,
          }));
        }
      }

      // Call AI for missing content
      const aiContext = {
        nome: projetoData.nome,
        descricao: projetoData.descricao,
        status: projetoData.status,
        orcamento: projetoData.orcamento_previsto,
        gasto: projetoData.valor_gasto,
        dataInicio: projetoData.data_inicio,
        dataFim: projetoData.data_fim,
        area: projetoData.areas_estrategicas?.nome,
        objetivo: projetoData.objetivos_estrategicos?.titulo,
        responsavel: projetoData.profiles?.nome,
        etapas: etapas.map((e) => ({
          nome: e.nome,
          status: e.status,
          descricao: e.descricao,
        })),
        swot,
        kpis: kpiList.map((k) => ({ nome: k.nome, meta: k.meta, unidade: k.unidade })),
      };

      const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-project-assistant", {
        body: { mode: "docx", context: aiContext },
      });

      if (aiError) throw new Error("Erro ao gerar conteúdo com IA");

      const aiContent: DocxAIContent = {
        resumo_executivo: aiData?.resumo_executivo || projetoData.descricao || "Projeto em desenvolvimento.",
        direcionadores: aiData?.direcionadores || "Direcionadores estratégicos a serem definidos.",
        diagnostico: aiData?.diagnostico || "Diagnóstico situacional a ser elaborado.",
        consideracoes_finais: aiData?.consideracoes_finais || "Considerações finais a serem elaboradas.",
      };

      // Build project data for generator
      const docxProject: DocxProjectData = {
        nome: projetoData.nome,
        descricao: projetoData.descricao,
        status: projetoData.status,
        saude: projetoData.saude,
        data_inicio: projetoData.data_inicio,
        data_fim: projetoData.data_fim,
        orcamento_previsto: projetoData.orcamento_previsto,
        valor_gasto: projetoData.valor_gasto,
        centro_custo: projetoData.centro_custo,
        area_nome: projetoData.areas_estrategicas?.nome,
        responsavel_nome: projetoData.profiles?.nome,
        objetivo_titulo: projetoData.objetivos_estrategicos?.titulo,
      };

      const docxEtapas: DocxEtapa[] = etapas.map((e) => ({
        nome: e.nome,
        descricao: e.descricao,
        data_inicio: e.data_inicio,
        data_fim: e.data_fim,
        status: e.status,
        valor_gasto: e.valor_gasto,
        responsavel_nome: e.responsavel_nome,
      }));

      await generateProjectDocx(docxProject, docxEtapas, swot, kpiList, aiContent);
      toast.success("Documento DOCX gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar DOCX:", err);
      toast.error(err?.message || "Erro ao gerar o documento DOCX");
    } finally {
      setGeneratingDocx(false);
    }
  }, [projetoData, selectedProjeto, etapas]);

  // ── Project report computations ──
  const concluidas = etapas.filter((e) => e.status === "concluido").length;
  const emAndamento = etapas.filter((e) => e.status === "em_andamento").length;
  const atrasadas = etapas.filter((e) => e.status === "atrasado").length;
  const naoIniciadas = etapas.filter((e) => e.status === "nao_iniciado").length;
  const canceladas = etapas.filter((e) => e.status === "cancelado").length;
  const etapasAtivas = etapas.length - canceladas;
  const progresso = etapasAtivas > 0 ? Math.round((concluidas * 100 + emAndamento * 50) / etapasAtivas) : 0;
  const orcamento = Number(projetoData?.orcamento_previsto || 0);
  const gasto = Number(projetoData?.valor_gasto || 0);
  const saldo = orcamento - gasto;
  const consumo = orcamento > 0 ? (gasto / orcamento) * 100 : 0;
  const gastoEtapas = etapas.reduce((s, e) => s + Number(e.valor_gasto || 0), 0);

  const diasRestantes = useMemo(() => {
    if (!projetoData?.data_fim) return null;
    try {
      return differenceInCalendarDays(parseISO(projetoData.data_fim), hoje);
    } catch { return null; }
  }, [projetoData]);

  // ── Portfolio computations ──
  const totais = useMemo(() => {
    const orcamento = portfolioProjetos.reduce((s, p) => s + Number(p.orcamento_previsto || 0), 0);
    const gasto = portfolioProjetos.reduce((s, p) => s + Number(p.valor_gasto || 0), 0);
    return { total: portfolioProjetos.length, orcamento, gasto, saldo: orcamento - gasto };
  }, [portfolioProjetos]);

  const statusCount = useMemo(() => {
    const counts: Record<string, number> = { nao_iniciado: 0, em_andamento: 0, concluido: 0, atrasado: 0, cancelado: 0 };
    portfolioProjetos.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return counts;
  }, [portfolioProjetos]);

  const resumoPorArea = useMemo(() => {
    const map: Record<string, { nome: string; qtd: number; orcamento: number; gasto: number }> = {};
    portfolioProjetos.forEach((p) => {
      const key = p.area_id || "sem_area";
      const nome = p.areas_estrategicas?.nome || "Sem Área";
      if (!map[key]) map[key] = { nome, qtd: 0, orcamento: 0, gasto: 0 };
      map[key].qtd++;
      map[key].orcamento += Number(p.orcamento_previsto || 0);
      map[key].gasto += Number(p.valor_gasto || 0);
    });
    return Object.values(map).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [portfolioProjetos]);

  const projetosOrdenados = useMemo(() => {
    return [...portfolioProjetos].sort((a, b) => {
      const aArea = a.areas_estrategicas?.nome || "";
      const bArea = b.areas_estrategicas?.nome || "";
      return aArea.localeCompare(bArea) || a.nome.localeCompare(b.nome);
    });
  }, [portfolioProjetos]);

  const exportCSV = () => {
    const headers = ["Projeto", "Área", "Responsável", "Status", "Orçamento", "Gasto", "Saldo"];
    const rows = projetosOrdenados.map((p) => [
      p.nome,
      p.areas_estrategicas?.nome || "Sem Área",
      p.profiles?.nome || "–",
      STATUS_LABELS[p.status] || p.status,
      Number(p.orcamento_previsto || 0),
      Number(p.valor_gasto || 0),
      Number(p.orcamento_previsto || 0) - Number(p.valor_gasto || 0),
    ]);
    rows.push(["TOTAL", "", "", "", totais.orcamento, totais.gasto, totais.saldo]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Relatórios executivos de projetos e portfólio</p>
        </div>
      </div>

      <Tabs defaultValue="projeto" onValueChange={(v) => v === "portfolio" && loadPortfolio()}>
        <TabsList className="print:hidden">
          <TabsTrigger value="projeto">Relatório de Projeto</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio Executivo</TabsTrigger>
        </TabsList>

        {/* ══════════ ABA: RELATÓRIO DE PROJETO ══════════ */}
        <TabsContent value="projeto" className="space-y-6">
          <Card className="shadow-sm print:hidden">
            <CardContent className="pt-6">
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Selecione um Projeto</Label>
                  <Select value={selectedProjeto} onValueChange={loadReport}>
                    <SelectTrigger><SelectValue placeholder="Escolha o projeto..." /></SelectTrigger>
                    <SelectContent>
                      {projetos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {projetoData && (
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateDocx} disabled={generatingDocx} variant="outline">
                      {generatingDocx ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
                      ) : (
                        <><FileText className="h-4 w-4 mr-2" /> Gerar DOCX</>
                      )}
                    </Button>
                    <Button onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {projetoData && (
            <div className="space-y-6" id="report-content">
              {/* ── Cabeçalho Institucional ── */}
              <Card className="shadow-sm border-t-4 border-t-primary">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">CBRio — Gestão Estratégica</p>
                      <h2 className="text-xl font-bold mt-1">Relatório de Status do Projeto</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{dataGeracao}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Nº {projetoData.id?.slice(0, 8).toUpperCase()}</p>
                      <p className="mt-1">Versão 1.0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Resumo Executivo ── */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    1. Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold flex-1">{projetoData.nome}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[projetoData.status]}`}>
                      {STATUS_ICONS[projetoData.status]}
                      {STATUS_LABELS[projetoData.status]}
                    </span>
                    {projetoData.saude && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${SAUDE_COLORS[projetoData.saude]}`}>
                        ● {SAUDE_LABELS[projetoData.saude]}
                      </span>
                    )}
                  </div>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Área:</span>
                      <span className="font-medium">{projetoData.areas_estrategicas?.nome || "–"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">{projetoData.profiles?.nome || "–"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Obj. Estratégico:</span>
                      <span className="font-medium">{projetoData.objetivos_estrategicos?.titulo || "–"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Início:</span>
                      <span className="font-medium">{fmtDate(projetoData.data_inicio)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Término:</span>
                      <span className="font-medium">{fmtDate(projetoData.data_fim)}</span>
                    </div>
                    {projetoData.centro_custo && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Centro Custo:</span>
                        <span className="font-medium">{projetoData.centro_custo}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Indicadores-Chave ── */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Indicadores-Chave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Progresso */}
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Progresso</p>
                      <p className="text-3xl font-bold">{progresso}%</p>
                      <Progress value={progresso} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {concluidas} concluída{concluidas !== 1 ? "s" : ""}, {emAndamento} em andamento, {naoIniciadas} não iniciada{naoIniciadas !== 1 ? "s" : ""}
                        {atrasadas > 0 && <>, <span className="text-destructive font-semibold">{atrasadas} atrasada{atrasadas !== 1 ? "s" : ""}</span></>}
                      </p>
                    </div>
                    {/* Financeiro */}
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Financeiro</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Orçado</span>
                          <span className="font-semibold">{fmt(orcamento)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gasto</span>
                          <span className="font-semibold">{fmt(gasto)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Saldo</span>
                          <span className={`font-bold ${saldo < 0 ? "text-destructive" : "text-[hsl(var(--success))]"}`}>{fmt(saldo)}</span>
                        </div>
                      </div>
                      <Progress value={Math.min(consumo, 100)} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">{consumo.toFixed(1)}% do orçamento consumido</p>
                    </div>
                    {/* Prazo */}
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Prazo</p>
                      {diasRestantes !== null ? (
                        <>
                          <p className={`text-3xl font-bold ${diasRestantes < 0 ? "text-destructive" : diasRestantes <= 30 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}`}>
                            {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {diasRestantes < 0 ? "Projeto além do prazo" : diasRestantes === 0 ? "Encerra hoje" : "dias restantes para conclusão"}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem data de término definida</p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {fmtDate(projetoData.data_inicio)} → {fmtDate(projetoData.data_fim)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Resumo de Status das Etapas ── */}
              {etapas.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      3. Status das Etapas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { key: "nao_iniciado", count: naoIniciadas, label: "Não Iniciadas", icon: <CircleDot className="h-5 w-5" /> },
                        { key: "em_andamento", count: emAndamento, label: "Em Andamento", icon: <Clock className="h-5 w-5" /> },
                        { key: "concluido", count: concluidas, label: "Concluídas", icon: <CheckCircle2 className="h-5 w-5" /> },
                        { key: "atrasado", count: atrasadas, label: "Atrasadas", icon: <AlertTriangle className="h-5 w-5" /> },
                        { key: "cancelado", count: canceladas, label: "Canceladas", icon: <XCircle className="h-5 w-5" /> },
                      ].map((item) => (
                        <div key={item.key} className={`flex flex-col items-center p-3 rounded-lg border text-center ${item.count > 0 ? "" : "opacity-50"}`}>
                          <span className={`mb-1 ${item.key === "concluido" ? "text-[hsl(var(--success))]" : item.key === "atrasado" ? "text-destructive" : item.key === "em_andamento" ? "text-primary" : "text-muted-foreground"}`}>
                            {item.icon}
                          </span>
                          <span className="text-2xl font-bold">{item.count}</span>
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Cronograma Detalhado ── */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    4. Cronograma de Etapas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {etapas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma etapa cadastrada para este projeto</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Etapa</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Início</TableHead>
                          <TableHead>Término</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor Gasto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {etapas.map((e, i) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-muted-foreground font-medium">{i + 1}</TableCell>
                            <TableCell>
                              <span className="font-medium">{e.nome}</span>
                              {e.descricao && <p className="text-xs text-muted-foreground mt-0.5">{e.descricao}</p>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{e.responsavel_nome || "–"}</TableCell>
                            <TableCell className="text-sm">{fmtDate(e.data_inicio)}</TableCell>
                            <TableCell className="text-sm">{fmtDate(e.data_fim)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status]}`}>
                                {STATUS_LABELS[e.status]}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{fmt(Number(e.valor_gasto || 0))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={6} className="font-bold">Total de gastos em etapas</TableCell>
                          <TableCell className="text-right font-bold">{fmt(gastoEtapas)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* ── Observações ── */}
              {projetoData.descricao && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      5. Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{projetoData.descricao}</p>
                  </CardContent>
                </Card>
              )}

              {/* ── Rodapé para impressão ── */}
              <div className="hidden print:block text-xs text-muted-foreground text-center pt-6 border-t mt-6">
                <p>CBRio – Gestão Estratégica – Relatório de Status do Projeto</p>
                <p>Gerado em {format(hoje, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ══════════ ABA: PORTFÓLIO EXECUTIVO ══════════ */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Cabeçalho institucional */}
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">CBRio — Gestão Estratégica</p>
                  <h2 className="text-xl font-bold mt-1">Relatório de Portfólio de Projetos</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{dataGeracao}</p>
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" /> CSV
                  </Button>
                  <Button size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Painel de Saúde do Portfólio */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { key: "nao_iniciado", label: "Não Iniciados", icon: <CircleDot className="h-5 w-5" />, color: "text-muted-foreground" },
              { key: "em_andamento", label: "Em Andamento", icon: <Clock className="h-5 w-5" />, color: "text-primary" },
              { key: "concluido", label: "Concluídos", icon: <CheckCircle2 className="h-5 w-5" />, color: "text-[hsl(var(--success))]" },
              { key: "atrasado", label: "Atrasados", icon: <AlertTriangle className="h-5 w-5" />, color: "text-destructive" },
              { key: "cancelado", label: "Cancelados", icon: <XCircle className="h-5 w-5" />, color: "text-muted-foreground" },
            ].map((s) => (
              <Card key={s.key} className="shadow-sm">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={`mx-auto mb-2 ${s.color}`}>{s.icon}</div>
                  <p className="text-3xl font-bold">{statusCount[s.key] || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cards financeiros */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total de Projetos</p>
                <p className="text-3xl font-bold mt-1">{totais.total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Orçamento Total</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.orcamento)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Gasto</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.gasto)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Total</p>
                <p className={`text-2xl font-bold mt-1 ${totais.saldo < 0 ? "text-destructive" : ""}`}>{fmt(totais.saldo)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo por Área */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Resumo Financeiro por Área Estratégica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-center">Projetos</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">% Consumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumoPorArea.map((a) => (
                    <TableRow key={a.nome}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-center">{a.qtd}</TableCell>
                      <TableCell className="text-right">{fmt(a.orcamento)}</TableCell>
                      <TableCell className="text-right">{fmt(a.gasto)}</TableCell>
                      <TableCell className="text-right">{fmt(a.orcamento - a.gasto)}</TableCell>
                      <TableCell className="text-right">
                        {a.orcamento > 0 ? ((a.gasto / a.orcamento) * 100).toFixed(1) + "%" : "–"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-center font-bold">{totais.total}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totais.orcamento)}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totais.gasto)}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totais.saldo)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {totais.orcamento > 0 ? ((totais.gasto / totais.orcamento) * 100).toFixed(1) + "%" : "–"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Tabela de Projetos */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Detalhamento por Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projetosOrdenados.map((p) => {
                    const orc = Number(p.orcamento_previsto || 0);
                    const gas = Number(p.valor_gasto || 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.areas_estrategicas?.nome || "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.profiles?.nome || "–"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{fmt(orc)}</TableCell>
                        <TableCell className="text-right">{fmt(gas)}</TableCell>
                        <TableCell className={`text-right ${orc - gas < 0 ? "text-destructive font-medium" : ""}`}>{fmt(orc - gas)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rodapé para impressão */}
          <div className="hidden print:block text-xs text-muted-foreground text-center pt-6 border-t mt-6">
            <p>CBRio – Gestão Estratégica – Relatório de Portfólio de Projetos</p>
            <p>Gerado em {format(hoje, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
