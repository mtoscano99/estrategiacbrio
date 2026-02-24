import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NovoKPIDialog } from "@/components/kpis/NovoKPIDialog";
import { KPICard } from "@/components/kpis/KPICard";
import { BarChart3, Target, AlertTriangle, HelpCircle } from "lucide-react";

interface KPIRow {
  id: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  meta: number;
  periodicidade: string;
  area_id: string | null;
  areas_estrategicas: { nome: string } | null;
}

interface MedicaoRow {
  kpi_id: string;
  valor: number;
  data_referencia: string;
}

export default function KPIs() {
  const { isCoordination } = useAuth();
  const [kpis, setKpis] = useState<KPIRow[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoRow[]>([]);
  const [areas, setAreas] = useState<{ id: string; nome: string }[]>([]);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterPeriodicidade, setFilterPeriodicidade] = useState<string>("all");

  const loadData = async () => {
    const [kpiRes, medRes, areaRes] = await Promise.all([
      supabase.from("kpis").select("id, nome, descricao, unidade, meta, periodicidade, area_id, areas_estrategicas(nome)"),
      supabase.from("kpi_medicoes").select("kpi_id, valor, data_referencia").order("data_referencia", { ascending: true }),
      supabase.from("areas_estrategicas").select("id, nome").order("nome"),
    ]);
    if (kpiRes.data) setKpis(kpiRes.data as any);
    if (medRes.data) setMedicoes(medRes.data as any);
    if (areaRes.data) setAreas(areaRes.data);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return kpis.filter((k) => {
      if (filterArea !== "all" && k.area_id !== filterArea) return false;
      if (filterPeriodicidade !== "all" && k.periodicidade !== filterPeriodicidade) return false;
      return true;
    });
  }, [kpis, filterArea, filterPeriodicidade]);

  const kpiCards = useMemo(() => {
    return filtered.map((k) => {
      const meds = medicoes
        .filter((m) => m.kpi_id === k.id)
        .sort((a, b) => a.data_referencia.localeCompare(b.data_referencia));
      return {
        id: k.id,
        nome: k.nome,
        unidade: k.unidade,
        meta: k.meta,
        periodicidade: k.periodicidade,
        area_nome: k.areas_estrategicas?.nome,
        medicoes: meds,
      };
    });
  }, [filtered, medicoes]);

  const stats = useMemo(() => {
    let noAlvo = 0, abaixo = 0, semDados = 0;
    kpiCards.forEach((k) => {
      if (k.medicoes.length === 0) { semDados++; return; }
      const last = k.medicoes[k.medicoes.length - 1].valor;
      if (last >= k.meta) noAlvo++; else abaixo++;
    });
    return { total: kpiCards.length, noAlvo, abaixo, semDados };
  }, [kpiCards]);

  const summaryCards = [
    { label: "Total de KPIs", value: stats.total, icon: BarChart3, color: "text-primary" },
    { label: "No Alvo", value: stats.noAlvo, icon: Target, color: "text-success" },
    { label: "Abaixo da Meta", value: stats.abaixo, icon: AlertTriangle, color: "text-destructive" },
    { label: "Sem Dados", value: stats.semDados, icon: HelpCircle, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Indicadores (KPIs)</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho dos indicadores estratégicos</p>
        </div>
        {isCoordination && <NovoKPIDialog onCreated={loadData} />}
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPeriodicidade} onValueChange={setFilterPeriodicidade}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Periodicidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
            <SelectItem value="semestral">Semestral</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {kpiCards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map((k) => (
            <KPICard key={k.id} kpi={k} onMedicaoCreated={loadData} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Nenhum KPI cadastrado</p>
          <p className="text-sm">Crie seu primeiro indicador para começar o acompanhamento</p>
        </div>
      )}
    </div>
  );
}
