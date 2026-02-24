import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NovaMedicaoDialog } from "./NovaMedicaoDialog";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Medicao {
  valor: number;
  data_referencia: string;
}

interface KPIData {
  id: string;
  nome: string;
  unidade: string;
  meta: number;
  periodicidade: string;
  area_nome?: string;
  medicoes: Medicao[];
}

interface Props {
  kpi: KPIData;
  onMedicaoCreated: () => void;
}

export function KPICard({ kpi, onMedicaoCreated }: Props) {
  const navigate = useNavigate();
  const lastValue = kpi.medicoes.length > 0 ? kpi.medicoes[kpi.medicoes.length - 1].valor : null;
  const progress = kpi.meta > 0 && lastValue !== null ? Math.min((lastValue / kpi.meta) * 100, 100) : 0;
  const isOnTarget = lastValue !== null && lastValue >= kpi.meta;

  const sparkData = kpi.medicoes.slice(-6).map((m) => ({ v: m.valor }));

  return (
    <Card
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/kpis/${kpi.id}`)}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{kpi.nome}</h3>
            {kpi.area_nome && (
              <p className="text-xs text-muted-foreground truncate">{kpi.area_nome}</p>
            )}
          </div>
          <Badge variant={isOnTarget ? "default" : lastValue === null ? "secondary" : "destructive"} className="shrink-0 text-xs">
            {lastValue === null ? "Sem dados" : isOnTarget ? "No alvo" : "Abaixo"}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{lastValue !== null ? lastValue : "—"}</p>
            <p className="text-xs text-muted-foreground">Meta: {kpi.meta} {kpi.unidade}</p>
          </div>
          {sparkData.length > 1 && (
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-xs">{kpi.periodicidade}</Badge>
          <div onClick={(e) => e.stopPropagation()}>
            <NovaMedicaoDialog
              kpiId={kpi.id}
              kpiNome={kpi.nome}
              unidade={kpi.unidade}
              onCreated={onMedicaoCreated}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
