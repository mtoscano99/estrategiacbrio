import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NovaMedicaoDialog } from "@/components/kpis/NovaMedicaoDialog";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface KPI {
  id: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  meta: number;
  periodicidade: string;
  areas_estrategicas: { nome: string } | null;
  objetivos_estrategicos: { titulo: string } | null;
}

interface Medicao {
  id: string;
  valor: number;
  data_referencia: string;
  observacao: string | null;
  created_at: string;
  profiles: { nome: string } | null;
}

export default function KPIDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCoordination } = useAuth();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);

  const loadData = async () => {
    if (!id) return;
    const [kpiRes, medRes] = await Promise.all([
      supabase.from("kpis").select("id, nome, descricao, unidade, meta, periodicidade, areas_estrategicas(nome), objetivos_estrategicos(titulo)").eq("id", id).single(),
      supabase.from("kpi_medicoes").select("id, valor, data_referencia, observacao, created_at, profiles:registrado_por(nome)").eq("kpi_id", id).order("data_referencia", { ascending: true }),
    ]);
    if (kpiRes.data) setKpi(kpiRes.data as any);
    if (medRes.data) setMedicoes(medRes.data as any);
  };

  useEffect(() => { loadData(); }, [id]);

  if (!kpi) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const chartData = medicoes.map((m) => ({
    data: format(new Date(m.data_referencia + "T00:00:00"), "dd/MM/yy"),
    valor: m.valor,
  }));

  const lastValue = medicoes.length > 0 ? medicoes[medicoes.length - 1].valor : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/kpis")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground">{kpi.nome}</h1>
          {kpi.descricao && <p className="text-muted-foreground mt-1">{kpi.descricao}</p>}
        </div>
        <NovaMedicaoDialog kpiId={kpi.id} kpiNome={kpi.nome} unidade={kpi.unidade} onCreated={loadData} />
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Meta: {kpi.meta} {kpi.unidade}</Badge>
        <Badge variant="outline">{kpi.periodicidade}</Badge>
        {kpi.areas_estrategicas && <Badge variant="secondary">{kpi.areas_estrategicas.nome}</Badge>}
        {kpi.objetivos_estrategicos && <Badge variant="secondary">{kpi.objetivos_estrategicos.titulo}</Badge>}
        {lastValue !== null && (
          <Badge variant={lastValue >= kpi.meta ? "default" : "destructive"}>
            Atual: {lastValue} {kpi.unidade}
          </Badge>
        )}
      </div>

      {/* Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Evolução</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <ReferenceLine y={kpi.meta} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: `Meta: ${kpi.meta}`, position: "right", fontSize: 11 }} />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Nenhuma medição registrada ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* History table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Medições</CardTitle>
        </CardHeader>
        <CardContent>
          {medicoes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...medicoes].reverse().map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{format(new Date(m.data_referencia + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{m.valor} {kpi.unidade}</TableCell>
                    <TableCell className="text-muted-foreground">{m.observacao || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.profiles?.nome || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma medição registrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
