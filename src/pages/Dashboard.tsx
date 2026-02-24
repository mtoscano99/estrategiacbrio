import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  CalendarClock,
  DollarSign,
  TrendingDown,
  Wallet,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stats {
  total: number;
  emAndamento: number;
  atrasados: number;
  concluidos: number;
}

interface FinanceiroTotal {
  orcamento: number;
  gasto: number;
  saldo: number;
  percentual: number;
}

interface FinanceiroPorArea {
  nome: string;
  orcamento: number;
  gasto: number;
  percentual: number;
}

interface UpcomingMilestone {
  id: string;
  nome: string;
  data_fim: string;
  status: string;
  projeto_nome: string;
  projeto_id: string;
  responsavel_nome: string | null;
  responsavel_avatar: string | null;
}

const STATUS_COLORS = {
  nao_iniciado: "hsl(215, 15%, 50%)",
  em_andamento: "hsl(215, 80%, 45%)",
  concluido: "hsl(142, 70%, 40%)",
  atrasado: "hsl(0, 72%, 51%)",
  cancelado: "hsl(215, 15%, 70%)",
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const getConsumoColor = (pct: number) => {
  if (pct < 50) return "hsl(142, 70%, 40%)";
  if (pct <= 80) return "hsl(45, 93%, 47%)";
  return "hsl(0, 72%, 51%)";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, emAndamento: 0, atrasados: 0, concluidos: 0 });
  const [projectsByArea, setProjectsByArea] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topKpis, setTopKpis] = useState<any[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<UpcomingMilestone[]>([]);
  const [financeiroTotal, setFinanceiroTotal] = useState<FinanceiroTotal>({ orcamento: 0, gasto: 0, saldo: 0, percentual: 0 });
  const [financeiroPorArea, setFinanceiroPorArea] = useState<FinanceiroPorArea[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: projetos } = await supabase.from("projetos").select("id, status, area_id, orcamento_previsto, valor_gasto, areas_estrategicas(nome)");

    if (projetos) {
      setStats({
        total: projetos.length,
        emAndamento: projetos.filter((p) => p.status === "em_andamento").length,
        atrasados: projetos.filter((p) => p.status === "atrasado").length,
        concluidos: projetos.filter((p) => p.status === "concluido").length,
      });

      // Group by area
      const areaMap: Record<string, number> = {};
      projetos.forEach((p: any) => {
        const area = p.areas_estrategicas?.nome || "Sem área";
        areaMap[area] = (areaMap[area] || 0) + 1;
      });
      setProjectsByArea(Object.entries(areaMap).map(([name, value]) => ({ name, value })));

      // Status breakdown
      const statusMap: Record<string, number> = {};
      projetos.forEach((p) => {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      });
      setStatusData(
        Object.entries(statusMap).map(([name, value]) => ({
          name: name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
          value,
          fill: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "hsl(215, 15%, 50%)",
        }))
      );

      // Financial data
      let totalOrcamento = 0;
      let totalGasto = 0;
      const areaFinMap: Record<string, { orcamento: number; gasto: number }> = {};

      projetos.forEach((p: any) => {
        const orc = Number(p.orcamento_previsto) || 0;
        const gst = Number(p.valor_gasto) || 0;
        totalOrcamento += orc;
        totalGasto += gst;

        const area = p.areas_estrategicas?.nome || "Sem área";
        if (!areaFinMap[area]) areaFinMap[area] = { orcamento: 0, gasto: 0 };
        areaFinMap[area].orcamento += orc;
        areaFinMap[area].gasto += gst;
      });

      setFinanceiroTotal({
        orcamento: totalOrcamento,
        gasto: totalGasto,
        saldo: totalOrcamento - totalGasto,
        percentual: totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0,
      });

      setFinanceiroPorArea(
        Object.entries(areaFinMap)
          .map(([nome, v]) => ({
            nome,
            orcamento: v.orcamento,
            gasto: v.gasto,
            percentual: v.orcamento > 0 ? (v.gasto / v.orcamento) * 100 : 0,
          }))
          .sort((a, b) => b.orcamento - a.orcamento)
      );
    }

    // Load top KPIs
    const { data: kpis } = await supabase.from("kpis").select("id, nome, unidade, meta, areas_estrategicas(nome)").limit(5);
    if (kpis && kpis.length > 0) {
      const { data: meds } = await supabase.from("kpi_medicoes").select("kpi_id, valor, data_referencia").order("data_referencia", { ascending: false });
      const kpiList = (kpis as any[]).map((k: any) => {
        const lastMed = meds?.find((m: any) => m.kpi_id === k.id);
        return { ...k, lastValue: lastMed?.valor ?? null, area_nome: k.areas_estrategicas?.nome };
      });
      setTopKpis(kpiList);
    }

    // Load upcoming milestones (etapas not concluded, with data_fim, ordered by date)
    const { data: etapas } = await supabase
      .from("etapas_projeto")
      .select("id, nome, data_fim, status, responsavel_id, projeto_id, projetos(id, nome)")
      .neq("status", "concluido")
      .neq("status", "cancelado")
      .not("data_fim", "is", null)
      .order("data_fim", { ascending: true })
      .limit(8);

    if (etapas && etapas.length > 0) {
      // Get responsible profiles
      const responsavelIds = [...new Set(etapas.map((e: any) => e.responsavel_id).filter(Boolean))];
      let profilesMap: Record<string, { nome: string; avatar_url: string | null }> = {};
      if (responsavelIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, nome, avatar_url").in("id", responsavelIds);
        if (profs) {
          profs.forEach((p: any) => { profilesMap[p.id] = { nome: p.nome, avatar_url: p.avatar_url }; });
        }
      }

      setUpcomingMilestones(
        (etapas as any[]).map((e) => ({
          id: e.id,
          nome: e.nome,
          data_fim: e.data_fim,
          status: e.status,
          projeto_nome: e.projetos?.nome || "—",
          projeto_id: e.projeto_id,
          responsavel_nome: e.responsavel_id ? profilesMap[e.responsavel_id]?.nome || null : null,
          responsavel_avatar: e.responsavel_id ? profilesMap[e.responsavel_id]?.avatar_url || null : null,
        }))
      );

      // Generate delay notifications for overdue etapas
      generateDelayNotifications(etapas as any[]);
    }
  };

  const generateDelayNotifications = async (etapas: any[]) => {
    const overdueEtapas = etapas.filter((e) => {
      if (!e.data_fim || e.status === "concluido" || e.status === "cancelado") return false;
      const dataFim = new Date(e.data_fim);
      return isPast(dataFim) && !isToday(dataFim);
    });

    if (overdueEtapas.length === 0) return;

    // Get existing recent delay notifications to avoid duplicates (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: existingNotifs } = await supabase
      .from("notificacoes")
      .select("link")
      .eq("tipo", "atraso")
      .gte("created_at", oneDayAgo.toISOString());

    const existingLinks = new Set(existingNotifs?.map((n) => n.link) || []);

    const newNotifs: Array<{
      usuario_id: string;
      tipo: string;
      titulo: string;
      mensagem: string;
      link: string;
    }> = [];

    for (const e of overdueEtapas) {
      const link = `/projetos/${e.projeto_id}`;
      if (existingLinks.has(link + `#etapa-${e.id}`)) continue;

      const targets: string[] = [];
      if (e.responsavel_id) targets.push(e.responsavel_id);

      // Also notify project owner if different
      const proj = e.projetos;
      if (proj) {
        const { data: projeto } = await supabase
          .from("projetos")
          .select("responsavel_id")
          .eq("id", e.projeto_id)
          .single();
        if (projeto?.responsavel_id && !targets.includes(projeto.responsavel_id)) {
          targets.push(projeto.responsavel_id);
        }
      }

      const days = Math.abs(differenceInDays(new Date(e.data_fim), new Date()));
      for (const uid of targets) {
        newNotifs.push({
          usuario_id: uid,
          tipo: "atraso",
          titulo: `Etapa atrasada: ${e.nome}`,
          mensagem: `A etapa "${e.nome}" do projeto ${e.projetos?.nome || ""} está ${days} dia(s) atrasada.`,
          link: `${link}#etapa-${e.id}`,
        });
      }
    }

    if (newNotifs.length > 0) {
      await supabase.from("notificacoes").insert(newNotifs);
    }
  };

  const kpiCards = [
    { title: "Total de Projetos", value: stats.total, icon: FolderKanban, color: "text-primary" },
    { title: "Em Andamento", value: stats.emAndamento, icon: Clock, color: "text-primary" },
    { title: "Atrasados", value: stats.atrasados, icon: AlertTriangle, color: "text-destructive" },
    { title: "Concluídos", value: stats.concluidos, icon: CheckCircle2, color: "text-success" },
  ];

  const finCards = [
    { title: "Orçamento Total", value: fmtBRL(financeiroTotal.orcamento), icon: DollarSign, color: "text-primary" },
    { title: "Total Gasto", value: fmtBRL(financeiroTotal.gasto), icon: TrendingDown, color: "text-destructive" },
    { title: "Saldo Restante", value: fmtBRL(financeiroTotal.saldo), icon: Wallet, color: financeiroTotal.saldo >= 0 ? "text-success" : "text-destructive" },
    { title: "% Consumo", value: `${financeiroTotal.percentual.toFixed(1)}%`, icon: Percent, color: financeiroTotal.percentual > 80 ? "text-destructive" : financeiroTotal.percentual > 50 ? "text-warning" : "text-success" },
  ];

  const CustomTooltipBRL = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {fmtBRL(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Gestão de Projetos CBRio</h1>
        <p className="text-muted-foreground mt-1">Visão geral do quadriênio 2026–2029</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {finCards.map((fc) => (
          <Card key={fc.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{fc.title}</p>
                  <p className="text-2xl font-bold mt-1">{fc.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${fc.color}`}>
                  <fc.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - Projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Projetos por Área</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsByArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={projectsByArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215, 80%, 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Nenhum projeto cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Nenhum projeto cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts - Financial */}
      {financeiroPorArea.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Orçamento vs Gasto por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financeiroPorArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v)} />
                  <Tooltip content={<CustomTooltipBRL />} />
                  <Legend />
                  <Bar dataKey="orcamento" name="Orçamento" fill="hsl(215, 80%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gasto" name="Gasto" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                % Consumo por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financeiroPorArea} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentual" name="% Consumo" radius={[0, 4, 4, 0]}>
                    {financeiroPorArea.map((entry, index) => (
                      <Cell key={index} fill={getConsumoColor(entry.percentual)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Próximos Marcos / Entregas
            </CardTitle>
            <button onClick={() => navigate("/projetos")} className="text-sm text-primary hover:underline">Ver projetos</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingMilestones.map((m) => {
                const dataFim = new Date(m.data_fim);
                const days = differenceInDays(dataFim, new Date());
                const overdue = isPast(dataFim) && !isToday(dataFim);
                const urgent = days >= 0 && days <= 7;

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projetos/${m.projeto_id}`)}
                  >
                    <div className={`w-1 h-10 rounded-full shrink-0 ${overdue ? "bg-destructive" : urgent ? "bg-warning" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.projeto_nome}</p>
                    </div>
                    {m.responsavel_nome && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <UserAvatar avatarUrl={m.responsavel_avatar} nome={m.responsavel_nome} className="h-5 w-5" />
                        <span className="text-xs text-muted-foreground hidden sm:inline">{m.responsavel_nome.split(" ")[0]}</span>
                      </div>
                    )}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{format(dataFim, "dd MMM", { locale: ptBR })}</p>
                      <Badge variant={overdue ? "destructive" : urgent ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {overdue ? `${Math.abs(days)}d atrasado` : isToday(dataFim) ? "Hoje" : `${days}d restantes`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top KPIs */}
      {topKpis.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Indicadores (KPIs)
            </CardTitle>
            <button onClick={() => navigate("/kpis")} className="text-sm text-primary hover:underline">Ver todos</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topKpis.map((k: any) => {
                const progress = k.meta > 0 && k.lastValue !== null ? Math.min((k.lastValue / k.meta) * 100, 100) : 0;
                return (
                  <div key={k.id} className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => navigate(`/kpis/${k.id}`)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{k.nome}</p>
                      <p className="text-xs text-muted-foreground">{k.area_nome || "Geral"}</p>
                    </div>
                    <div className="w-32">
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold">{k.lastValue ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">/{k.meta} {k.unidade}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
