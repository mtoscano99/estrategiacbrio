import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, Download, Printer } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export default function Relatorios() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [selectedProjeto, setSelectedProjeto] = useState("");
  const [projetoData, setProjetoData] = useState<any>(null);
  const [etapas, setEtapas] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("projetos").select("id, nome").order("nome").then(({ data }) => {
      if (data) setProjetos(data);
    });
  }, []);

  const loadReport = async (projetoId: string) => {
    setSelectedProjeto(projetoId);
    const [projetoRes, etapasRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome), objetivos_estrategicos(titulo)").eq("id", projetoId).single(),
      supabase.from("etapas_projeto").select("*").eq("projeto_id", projetoId).order("ordem"),
    ]);
    if (projetoRes.data) setProjetoData(projetoRes.data);
    if (etapasRes.data) setEtapas(etapasRes.data);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Relatório enviado para impressão");
  };

  const concluidas = etapas.filter((e) => e.status === "concluido").length;
  const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">Gere relatórios padronizados dos projetos</p>
      </div>

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
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {projetoData && (
        <div className="space-y-4" id="report-content">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Relatório do Projeto</p>
                  <CardTitle className="text-xl mt-1">{projetoData.nome}</CardTitle>
                </div>
                <Badge>{STATUS_LABELS[projetoData.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Dados Gerais */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Dados Gerais</h3>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Área:</span> {projetoData.areas_estrategicas?.nome || "–"}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {projetoData.profiles?.nome || "–"}</div>
                  <div><span className="text-muted-foreground">Objetivo Estratégico:</span> {projetoData.objetivos_estrategicos?.titulo || "–"}</div>
                  <div><span className="text-muted-foreground">Período:</span> {projetoData.data_inicio || "–"} → {projetoData.data_fim || "–"}</div>
                </div>
              </div>

              {/* Financeiro */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financeiro</h3>
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Orçado</p>
                    <p className="font-bold text-lg">{Number(projetoData.orcamento_previsto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Gasto</p>
                    <p className="font-bold text-lg">{Number(projetoData.valor_gasto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="font-bold text-lg">{(Number(projetoData.orcamento_previsto) - Number(projetoData.valor_gasto)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                </div>
              </div>

              {/* Etapas */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Cronograma – {progresso}% concluído ({concluidas}/{etapas.length} etapas)
                </h3>
                {etapas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada</p>
                ) : (
                  <div className="space-y-1">
                    {etapas.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 text-sm">
                        <span className="text-muted-foreground w-6 text-right">{i + 1}.</span>
                        <span className="flex-1">{e.nome}</span>
                        <Badge variant={e.status === "concluido" ? "default" : e.status === "atrasado" ? "destructive" : "secondary"} className="text-xs">
                          {STATUS_LABELS[e.status]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              {projetoData.descricao && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{projetoData.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
