import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Target, ChevronRight } from "lucide-react";

const TEMAS = {
  2026: "Unidade",
  2027: "Reavaliação",
  2028: "Escalonamento",
  2029: "Maturidade",
};

export default function PlanejamentoEstrategico() {
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [alvos, setAlvos] = useState<any[]>([]);
  const [diagnostico, setDiagnostico] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("objetivos_estrategicos").select("*, areas_estrategicas(nome)").order("ano"),
      supabase.from("alvos_pe").select("*"),
      supabase.from("diagnostico_situacional").select("*").order("categoria"),
    ]).then(([objRes, alvosRes, diagRes]) => {
      if (objRes.data) setObjetivos(objRes.data);
      if (alvosRes.data) setAlvos(alvosRes.data);
      if (diagRes.data) setDiagnostico(diagRes.data);
    });
  }, []);

  const objByYear = (year: number) => objetivos.filter((o) => o.ano === year);
  const alvosForObj = (objId: string) => alvos.filter((a) => a.objetivo_id === objId);

  // Group diagnostico by categoria
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
                    {objByYear(year).map((obj) => (
                      <AccordionItem key={obj.id} value={obj.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2 text-left">
                            <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                            <div>
                              <p className="font-medium">{obj.titulo}</p>
                              {obj.areas_estrategicas?.nome && (
                                <p className="text-xs text-muted-foreground">{obj.areas_estrategicas.nome}</p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {obj.descricao && <p className="text-sm text-muted-foreground mb-3">{obj.descricao}</p>}
                          {alvosForObj(obj.id).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Alvos e KPIs:</p>
                              {alvosForObj(obj.id).map((alvo) => (
                                <div key={alvo.id} className="pl-4 border-l-2 border-primary/20 py-1">
                                  <p className="text-sm">{alvo.descricao}</p>
                                  {alvo.meta && <p className="text-xs text-muted-foreground">Meta: {alvo.meta}</p>}
                                  {alvo.indicador && <p className="text-xs text-muted-foreground">Indicador: {alvo.indicador}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
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
