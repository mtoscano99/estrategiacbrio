import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { FileBarChart, Download, Printer, Briefcase } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  nao_iniciado: "secondary",
  em_andamento: "default",
  concluido: "default",
  atrasado: "destructive",
  cancelado: "outline",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
      supabase.from("etapas_projeto").select("*").eq("projeto_id", projetoId).order("ordem"),
    ]);
    if (projetoRes.data) setProjetoData(projetoRes.data);
    if (etapasRes.data) setEtapas(etapasRes.data);
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

  const handlePrint = () => {
    window.print();
    toast.success("Relatório enviado para impressão");
  };

  // Portfolio computations
  const totais = useMemo(() => {
    const orcamento = portfolioProjetos.reduce((s, p) => s + Number(p.orcamento_previsto || 0), 0);
    const gasto = portfolioProjetos.reduce((s, p) => s + Number(p.valor_gasto || 0), 0);
    return { total: portfolioProjetos.length, orcamento, gasto, saldo: orcamento - gasto };
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
    const date = new Date().toISOString().slice(0, 10);
    a.download = `portfolio_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
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

      <Tabs defaultValue="projeto" onValueChange={(v) => v === "portfolio" && loadPortfolio()}>
        <TabsList>
          <TabsTrigger value="projeto">Por Projeto</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
        </TabsList>

        {/* ── Aba Por Projeto ── */}
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
                  <Button onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Dados Gerais</h3>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div><span className="text-muted-foreground">Área:</span> {projetoData.areas_estrategicas?.nome || "–"}</div>
                      <div><span className="text-muted-foreground">Responsável:</span> {projetoData.profiles?.nome || "–"}</div>
                      <div><span className="text-muted-foreground">Objetivo Estratégico:</span> {projetoData.objetivos_estrategicos?.titulo || "–"}</div>
                      <div><span className="text-muted-foreground">Período:</span> {projetoData.data_inicio || "–"} → {projetoData.data_fim || "–"}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financeiro</h3>
                    <div className="grid gap-2 sm:grid-cols-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-xs text-muted-foreground">Orçado</p>
                        <p className="font-bold text-lg">{fmt(Number(projetoData.orcamento_previsto))}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-xs text-muted-foreground">Gasto</p>
                        <p className="font-bold text-lg">{fmt(Number(projetoData.valor_gasto))}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className="font-bold text-lg">{fmt(Number(projetoData.orcamento_previsto) - Number(projetoData.valor_gasto))}</p>
                      </div>
                    </div>
                  </div>

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
        </TabsContent>

        {/* ── Aba Portfólio ── */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase">Total de Projetos</p>
                <p className="text-3xl font-bold mt-1">{totais.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase">Orçamento Total</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.orcamento)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase">Total Gasto</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.gasto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-muted-foreground uppercase">Saldo Total</p>
                <p className="text-2xl font-bold mt-1">{fmt(totais.saldo)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo por Área */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro por Área Estratégica</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-center">Qtd Projetos</TableHead>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Todos os Projetos</CardTitle>
              <Button onClick={exportCSV} size="sm">
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
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
                        <TableCell>{p.profiles?.nome || "–"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[p.status] || "secondary"} className="text-xs">
                            {STATUS_LABELS[p.status] || p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{fmt(orc)}</TableCell>
                        <TableCell className="text-right">{fmt(gas)}</TableCell>
                        <TableCell className="text-right">{fmt(orc - gas)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
