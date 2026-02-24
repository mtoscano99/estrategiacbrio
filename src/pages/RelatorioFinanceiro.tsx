import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  Percent,
  Printer,
  Download,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "sonner";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const getConsumoColor = (pct: number) => {
  if (pct < 50) return "hsl(142, 70%, 40%)";
  if (pct <= 80) return "hsl(45, 93%, 47%)";
  return "hsl(0, 72%, 51%)";
};

const getConsumoVariant = (pct: number): "default" | "secondary" | "destructive" => {
  if (pct < 50) return "default";
  if (pct <= 80) return "secondary";
  return "destructive";
};

const AREA_COLORS = [
  "hsl(215, 80%, 45%)",
  "hsl(142, 70%, 40%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(330, 60%, 50%)",
];

interface ProjetoFin {
  id: string;
  nome: string;
  status: string;
  area_nome: string;
  responsavel_nome: string;
  orcamento: number;
  gasto: number;
  saldo: number;
  percentual: number;
  centro_custo: string | null;
}

interface AreaResumo {
  nome: string;
  qtd: number;
  orcamento: number;
  gasto: number;
  saldo: number;
  percentual: number;
}

export default function RelatorioFinanceiro() {
  const [projetos, setProjetos] = useState<ProjetoFin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome, status, orcamento_previsto, valor_gasto, centro_custo, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome)")
      .order("nome");

    if (data) {
      setProjetos(
        (data as any[]).map((p) => {
          const orc = Number(p.orcamento_previsto) || 0;
          const gst = Number(p.valor_gasto) || 0;
          return {
            id: p.id,
            nome: p.nome,
            status: p.status,
            area_nome: p.areas_estrategicas?.nome || "Sem Área",
            responsavel_nome: p.profiles?.nome || "–",
            orcamento: orc,
            gasto: gst,
            saldo: orc - gst,
            percentual: orc > 0 ? (gst / orc) * 100 : 0,
            centro_custo: p.centro_custo,
          };
        })
      );
    }
    setLoading(false);
  };

  const areas = useMemo(() => {
    const set = new Set(projetos.map((p) => p.area_nome));
    return Array.from(set).sort();
  }, [projetos]);

  const filtered = useMemo(() => {
    return projetos.filter((p) => {
      if (filtroArea !== "todas" && p.area_nome !== filtroArea) return false;
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
      return true;
    });
  }, [projetos, filtroArea, filtroStatus]);

  const totais = useMemo(() => {
    const orcamento = filtered.reduce((s, p) => s + p.orcamento, 0);
    const gasto = filtered.reduce((s, p) => s + p.gasto, 0);
    return {
      total: filtered.length,
      orcamento,
      gasto,
      saldo: orcamento - gasto,
      percentual: orcamento > 0 ? (gasto / orcamento) * 100 : 0,
    };
  }, [filtered]);

  const resumoPorArea = useMemo(() => {
    const map: Record<string, AreaResumo> = {};
    filtered.forEach((p) => {
      if (!map[p.area_nome]) map[p.area_nome] = { nome: p.area_nome, qtd: 0, orcamento: 0, gasto: 0, saldo: 0, percentual: 0 };
      map[p.area_nome].qtd++;
      map[p.area_nome].orcamento += p.orcamento;
      map[p.area_nome].gasto += p.gasto;
    });
    return Object.values(map)
      .map((a) => ({
        ...a,
        saldo: a.orcamento - a.gasto,
        percentual: a.orcamento > 0 ? (a.gasto / a.orcamento) * 100 : 0,
      }))
      .sort((a, b) => b.orcamento - a.orcamento);
  }, [filtered]);

  const orcamentoPieData = useMemo(() => {
    return resumoPorArea.map((a, i) => ({
      name: a.nome,
      value: a.orcamento,
      fill: AREA_COLORS[i % AREA_COLORS.length],
    }));
  }, [resumoPorArea]);

  const handlePrint = () => {
    window.print();
    toast.success("Relatório enviado para impressão / PDF");
  };

  const exportCSV = () => {
    const headers = ["Projeto", "Área", "Centro de Custo", "Responsável", "Status", "Orçamento", "Gasto", "Saldo", "% Consumo"];
    const rows = filtered.map((p) => [
      p.nome,
      p.area_nome,
      p.centro_custo || "–",
      p.responsavel_nome,
      STATUS_LABELS[p.status] || p.status,
      p.orcamento,
      p.gasto,
      p.saldo,
      p.percentual.toFixed(1) + "%",
    ]);
    rows.push(["TOTAL", "", "", "", "", totais.orcamento, totais.gasto, totais.saldo, totais.percentual.toFixed(1) + "%"]);

    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  };

  const CustomTooltipBRL = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando dados financeiros...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Relatório Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">Visão consolidada de orçamento, gastos e saldos</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Área Estratégica</Label>
              <Select value={filtroArea} onValueChange={setFiltroArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Áreas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.orcamento)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.gasto)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted text-destructive">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Restante</p>
                <p className={`text-2xl font-bold mt-1 ${totais.saldo >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmt(totais.saldo)}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-muted ${totais.saldo >= 0 ? "text-success" : "text-destructive"}`}>
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">% Consumo</p>
                <p className="text-2xl font-bold mt-1">{totais.percentual.toFixed(1)}%</p>
                <Progress value={Math.min(totais.percentual, 100)} className="h-2 mt-2" />
              </div>
              <div className={`p-3 rounded-xl bg-muted ${totais.percentual > 80 ? "text-destructive" : totais.percentual > 50 ? "text-warning" : "text-success"}`}>
                <Percent className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget vs Spent by Area */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Orçamento vs Gasto por Área</CardTitle>
          </CardHeader>
          <CardContent>
            {resumoPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resumoPorArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<CustomTooltipBRL />} />
                  <Legend />
                  <Bar dataKey="orcamento" name="Orçamento" fill="hsl(215, 80%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gasto" name="Gasto" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Distribution Pie */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            {orcamentoPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orcamentoPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {orcamentoPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* % Consumption by Area - Horizontal */}
      {resumoPorArea.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">% Consumo por Área Estratégica</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, resumoPorArea.length * 50)}>
              <BarChart data={resumoPorArea} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="percentual" name="% Consumo" radius={[0, 4, 4, 0]}>
                  {resumoPorArea.map((entry, index) => (
                    <Cell key={index} fill={getConsumoColor(entry.percentual)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Area Summary Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Resumo Financeiro por Área</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área Estratégica</TableHead>
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
                  <TableCell className="text-right">{fmtFull(a.orcamento)}</TableCell>
                  <TableCell className="text-right">{fmtFull(a.gasto)}</TableCell>
                  <TableCell className={`text-right ${a.saldo < 0 ? "text-destructive font-medium" : ""}`}>
                    {fmtFull(a.saldo)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getConsumoVariant(a.percentual)} className="text-xs">
                      {a.percentual.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-center font-bold">{totais.total}</TableCell>
                <TableCell className="text-right font-bold">{fmtFull(totais.orcamento)}</TableCell>
                <TableCell className="text-right font-bold">{fmtFull(totais.gasto)}</TableCell>
                <TableCell className="text-right font-bold">{fmtFull(totais.saldo)}</TableCell>
                <TableCell className="text-right font-bold">
                  <Badge variant={getConsumoVariant(totais.percentual)} className="text-xs">
                    {totais.percentual.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Project Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Projeto</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>C. Custo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orçamento</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">% Consumo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum projeto encontrado com os filtros selecionados
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.area_nome}</TableCell>
                    <TableCell className="text-muted-foreground">{p.centro_custo || "–"}</TableCell>
                    <TableCell>{p.responsavel_nome}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "atrasado" ? "destructive" : p.status === "concluido" ? "default" : "secondary"} className="text-xs">
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmtFull(p.orcamento)}</TableCell>
                    <TableCell className="text-right">{fmtFull(p.gasto)}</TableCell>
                    <TableCell className={`text-right ${p.saldo < 0 ? "text-destructive font-medium" : ""}`}>
                      {fmtFull(p.saldo)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getConsumoVariant(p.percentual)} className="text-xs">
                        {p.percentual.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filtered.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="font-bold">Total ({filtered.length} projetos)</TableCell>
                  <TableCell className="text-right font-bold">{fmtFull(totais.orcamento)}</TableCell>
                  <TableCell className="text-right font-bold">{fmtFull(totais.gasto)}</TableCell>
                  <TableCell className="text-right font-bold">{fmtFull(totais.saldo)}</TableCell>
                  <TableCell className="text-right font-bold">
                    <Badge variant={getConsumoVariant(totais.percentual)} className="text-xs">
                      {totais.percentual.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Print footer */}
      <div className="hidden print:block text-xs text-muted-foreground text-center pt-4 border-t">
        Relatório Financeiro – CBRio Gestão Estratégica – Gerado em {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
