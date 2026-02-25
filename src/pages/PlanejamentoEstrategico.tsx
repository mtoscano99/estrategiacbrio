import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Target, ChevronRight, ExternalLink, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { NovoKPIDialog } from "@/components/kpis/NovoKPIDialog";

const TEMAS = {
  2026: "Unidade",
  2027: "Reavaliação",
  2028: "Escalonamento",
  2029: "Maturidade",
};

interface KpiWithProgress {
  id: string;
  nome: string;
  meta: number;
  unidade: string;
  objetivo_id: string | null;
  ultimoValor: number | null;
  percentual: number | null;
}

export default function PlanejamentoEstrategico() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [alvos, setAlvos] = useState<any[]>([]);
  const [diagnostico, setDiagnostico] = useState<any[]>([]);
  const [kpisById, setKpisById] = useState<Record<string, KpiWithProgress>>({});

  const fetchData = () => {
    Promise.all([
      supabase.from("objetivos_estrategicos").select("*, areas_estrategicas(nome)").order("ano"),
      supabase.from("alvos_pe").select("*"),
      supabase.from("diagnostico_situacional").select("*").order("categoria"),
      supabase.from("kpis").select("id, nome, meta, unidade, objetivo_id"),
      supabase.from("kpi_medicoes").select("kpi_id, valor, data_referencia").order("data_referencia", { ascending: false }),
    ]).then(([objRes, alvosRes, diagRes, kpisRes, medicoesRes]) => {
      if (objRes.data) setObjetivos(objRes.data);
      if (alvosRes.data) setAlvos(alvosRes.data);
      if (diagRes.data) setDiagnostico(diagRes.data);

      if (kpisRes.data && medicoesRes.data) {
        const medicoesByKpi: Record<string, { valor: number }> = {};
        for (const m of medicoesRes.data) {
          if (!medicoesByKpi[m.kpi_id]) {
            medicoesByKpi[m.kpi_id] = { valor: m.valor };
          }
        }

        const byId: Record<string, KpiWithProgress> = {};
        for (const kpi of kpisRes.data) {
          const med = medicoesByKpi[kpi.id];
          const ultimoValor = med ? med.valor : null;
          const percentual = ultimoValor !== null && kpi.meta > 0
            ? Math.round((ultimoValor / kpi.meta) * 100)
            : null;
          byId[kpi.id] = {
            id: kpi.id,
            nome: kpi.nome,
            meta: kpi.meta,
            unidade: kpi.unidade,
            objetivo_id: kpi.objetivo_id,
            ultimoValor,
            percentual,
          };
        }
        setKpisById(byId);
      }
    });
  };

  useEffect(() => { fetchData(); }, []);

  const objByYear = (year: number) => objetivos.filter((o) => o.ano === year);
  const alvosForObj = (objId: string) => alvos.filter((a) => a.objetivo_id === objId);
  const getKpiForAlvo = (alvo: any): KpiWithProgress | null => {
    if (alvo.kpi_id && kpisById[alvo.kpi_id]) return kpisById[alvo.kpi_id];
    return null;
  };

  const getStatusBadge = (percentual: number | null) => {
    if (percentual === null) return <Badge variant="outline" className="text-xs">Sem dados</Badge>;
    if (percentual >= 90) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-xs"><TrendingUp className="h-3 w-3 mr-1" />No alvo</Badge>;
    if (percentual >= 60) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs"><Minus className="h-3 w-3 mr-1" />Atenção</Badge>;
    return <Badge className="bg-red-500/15 text-red-700 border-red-200 text-xs"><TrendingDown className="h-3 w-3 mr-1" />Abaixo</Badge>;
  };

  const getObjSummary = (objId: string) => {
    const objAlvos = alvosForObj(objId);
    if (objAlvos.length === 0) return null;
    const linked = objAlvos.map(a => getKpiForAlvo(a)).filter(Boolean) as KpiWithProgress[];
    if (linked.length === 0) return null;
    const onTarget = linked.filter(k => k.percentual !== null && k.percentual >= 90).length;
    return { onTarget, total: linked.length };
  };

  const diagCategories = [...new Set(diagnostico.map((d) => d.categoria))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Planejamento Estratégico
        </h1>
        <p className="text-muted-foreground mt-1">Quadriênio 2026–2029 • Macro Eixo Estratégico CBRio</p>
      </div>

      <Tabs defaultValue="2026">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          {[2026, 2027, 2028, 2029].map((year) => (
            <TabsTrigger key={year} value={year.toString()}>
              {year}
            </TabsTrigger>
          ))}
        </TabsList>

        {[2026, 2027, 2028, 2029].map((year) => (
          <TabsContent key={year} value={year.toString()} className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{year}</CardTitle>
                  <Badge>{TEMAS[year as keyof typeof TEMAS]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {objByYear(year).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum objetivo cadastrado para este ano</p>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {objByYear(year).map((obj) => {
                      const summary = getObjSummary(obj.id);
                      return (
                        <AccordionItem key={obj.id} value={obj.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-left flex-1">
                              <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium">{obj.titulo}</p>
                                {obj.areas_estrategicas?.nome && (
                                  <p className="text-xs text-muted-foreground">{obj.areas_estrategicas.nome}</p>
                                )}
                              </div>
                              {summary && (
                                <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                                  {summary.onTarget}/{summary.total} no alvo
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {obj.descricao && <p className="text-sm text-muted-foreground mb-3">{obj.descricao}</p>}
                            {alvosForObj(obj.id).length > 0 && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Alvos e KPIs:</p>
                                {alvosForObj(obj.id).map((alvo) => {
                                  const matchedKpi = getKpiForAlvo(alvo);

                                  return (
                                    <div key={alvo.id} className="pl-4 border-l-2 border-primary/20 py-2 space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium">{alvo.descricao}</p>
                                        {matchedKpi ? getStatusBadge(matchedKpi.percentual) : getStatusBadge(null)}
                                      </div>

                                      {matchedKpi && matchedKpi.ultimoValor !== null ? (
                                        <>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Meta: {matchedKpi.meta}{matchedKpi.unidade}</span>
                                            <span>·</span>
                                            <span>Atual: {matchedKpi.ultimoValor}{matchedKpi.unidade}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Progress value={Math.min(matchedKpi.percentual || 0, 100)} className="h-2 flex-1" />
                                            <span className="text-xs font-medium text-muted-foreground w-10 text-right">{matchedKpi.percentual}%</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          {alvo.meta && <p className="text-xs text-muted-foreground">Meta: {alvo.meta}</p>}
                                        </>
                                      )}

                                      <div className="flex items-center justify-between">
                                        {alvo.indicador && <p className="text-xs text-muted-foreground">Indicador: {alvo.indicador}</p>}
                                        {matchedKpi ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs gap-1 text-primary"
                                            onClick={() => navigate(`/kpis/${matchedKpi.id}`)}
                                          >
                                            Ver KPI <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        ) : role === "coordenacao" ? (
                                          <NovoKPIDialog onCreated={fetchData} />
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Diagnóstico Situacional */}
      {diagCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Diagnóstico Situacional</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple">
              {diagCategories.map((cat) => (
                <AccordionItem key={cat} value={cat}>
                  <AccordionTrigger>{cat}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {diagnostico
                        .filter((d) => d.categoria === cat)
                        .map((d) => (
                          <div key={d.id} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                            <span className="text-sm">{d.indicador}</span>
                            <span className="text-sm font-medium">{d.valor}</span>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
