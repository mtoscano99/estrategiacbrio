import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
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
} from "recharts";

interface Stats {
  total: number;
  emAndamento: number;
  atrasados: number;
  concluidos: number;
}

const STATUS_COLORS = {
  nao_iniciado: "hsl(215, 15%, 50%)",
  em_andamento: "hsl(215, 80%, 45%)",
  concluido: "hsl(142, 70%, 40%)",
  atrasado: "hsl(0, 72%, 51%)",
  cancelado: "hsl(215, 15%, 70%)",
};

const YEARS = [
  { ano: 2026, tema: "Unidade" },
  { ano: 2027, tema: "Reavaliação" },
  { ano: 2028, tema: "Escalonamento" },
  { ano: 2029, tema: "Maturidade" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, emAndamento: 0, atrasados: 0, concluidos: 0 });
  const [projectsByArea, setProjectsByArea] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: projetos } = await supabase.from("projetos").select("id, status, area_id, areas_estrategicas(nome)");

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
    }
  };

  const kpiCards = [
    { title: "Total de Projetos", value: stats.total, icon: FolderKanban, color: "text-primary" },
    { title: "Em Andamento", value: stats.emAndamento, icon: Clock, color: "text-primary" },
    { title: "Atrasados", value: stats.atrasados, icon: AlertTriangle, color: "text-destructive" },
    { title: "Concluídos", value: stats.concluidos, icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard Estratégico</h1>
        <p className="text-muted-foreground mt-1">Visão geral do quadriênio 2026–2029</p>
      </div>

      {/* KPI Cards */}
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

      {/* Timeline */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Linha do Tempo Estratégica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between px-4">
            {YEARS.map((y, i) => (
              <div key={y.ano} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {i > 0 && <div className="flex-1 h-0.5 bg-border" />}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${y.ano === 2026 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {y.ano.toString().slice(2)}
                  </div>
                  {i < YEARS.length - 1 && <div className="flex-1 h-0.5 bg-border" />}
                </div>
                <p className="text-sm font-semibold mt-2">{y.ano}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {y.tema}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
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
    </div>
  );
}
