import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  nao_iniciado: "secondary",
  em_andamento: "default",
  concluido: "outline",
  atrasado: "destructive",
  cancelado: "secondary",
};

export default function Projetos() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [projetosRes, areasRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome)").order("created_at", { ascending: false }),
      supabase.from("areas_estrategicas").select("id, nome"),
    ]);
    if (projetosRes.data) setProjetos(projetosRes.data);
    if (areasRes.data) setAreas(areasRes.data);
  };

  const filtered = projetos.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === "all" || p.area_id === filterArea;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchArea && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} projeto(s) encontrado(s)</p>
        </div>
        <Button asChild>
          <Link to="/novo-projeto">
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Áreas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum projeto encontrado. Crie um novo projeto para começar.
            </CardContent>
          </Card>
        ) : (
          filtered.map((projeto) => (
            <Link key={projeto.id} to={`/projetos/${projeto.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{projeto.nome}</h3>
                        <Badge variant={STATUS_VARIANTS[projeto.status] || "secondary"}>
                          {STATUS_LABELS[projeto.status] || projeto.status}
                        </Badge>
                      </div>
                      {projeto.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{projeto.descricao}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {projeto.areas_estrategicas?.nome && (
                          <span className="bg-muted px-2 py-0.5 rounded">{projeto.areas_estrategicas.nome}</span>
                        )}
                        {projeto.profiles?.nome && <span>Resp: {projeto.profiles.nome}</span>}
                        {projeto.data_inicio && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(projeto.data_inicio), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {projeto.orcamento_previsto > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {Number(projeto.orcamento_previsto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
