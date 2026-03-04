import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Calendar, DollarSign, FileStack, FolderOpen, ChevronDown, Trash2, Pencil, CheckSquare, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
}

export default function Projetos() {
  const { isCoordination } = useAuth();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCC, setFilterCC] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");

  // Category management
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatCor, setNewCatCor] = useState("#6366f1");
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveTarget, setMoveTarget] = useState<string>("__none__");

  // Collapsible categories
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [projetosRes, areasRes, catRes] = await Promise.all([
      supabase.from("projetos").select("*, areas_estrategicas(nome), profiles!projetos_responsavel_id_fkey(nome), categorias_projeto(id, nome, cor)").order("created_at", { ascending: false }),
      supabase.from("areas_estrategicas").select("id, nome"),
      supabase.from("categorias_projeto").select("id, nome, descricao, cor").order("nome"),
    ]);
    if (projetosRes.data) setProjetos(projetosRes.data);
    if (areasRes.data) setAreas(areasRes.data);
    if (catRes.data) setCategorias(catRes.data as any);
  };

  const centrosCusto = [...new Set(projetos.map((p) => p.centro_custo).filter(Boolean))].sort();

  const filtered = projetos.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === "all" || p.area_id === filterArea;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchCC = filterCC === "all" || p.centro_custo === filterCC;
    const matchCat = filterCategoria === "all" || (filterCategoria === "sem_categoria" ? !p.categoria_id : p.categoria_id === filterCategoria);
    return matchSearch && matchArea && matchStatus && matchCC && matchCat;
  });

  // Group by category
  const grouped = (() => {
    const groups: { categoria: Categoria | null; projetos: any[] }[] = [];
    const catMap = new Map<string | null, any[]>();
    
    filtered.forEach((p) => {
      const key = p.categoria_id || null;
      if (!catMap.has(key)) catMap.set(key, []);
      catMap.get(key)!.push(p);
    });

    // Show categorized first, then uncategorized
    categorias.forEach((cat) => {
      if (catMap.has(cat.id)) {
        groups.push({ categoria: cat, projetos: catMap.get(cat.id)! });
      }
    });
    if (catMap.has(null)) {
      groups.push({ categoria: null, projetos: catMap.get(null)! });
    }

    return groups;
  })();

  const toggleCollapse = (catId: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const saveCat = async () => {
    if (!newCatName.trim()) return;
    if (editingCat) {
      const { error } = await supabase.from("categorias_projeto").update({ nome: newCatName, cor: newCatCor } as any).eq("id", editingCat.id);
      if (error) { toast.error("Erro ao atualizar categoria"); return; }
      toast.success("Categoria atualizada");
    } else {
      const { error } = await supabase.from("categorias_projeto").insert({ nome: newCatName, cor: newCatCor } as any);
      if (error) { toast.error("Erro ao criar categoria"); return; }
      toast.success("Categoria criada");
    }
    setNewCatName("");
    setNewCatCor("#6366f1");
    setEditingCat(null);
    loadData();
  };

  const deleteCat = async (id: string) => {
    const { error } = await supabase.from("categorias_projeto").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir categoria"); return; }
    toast.success("Categoria excluída");
    loadData();
  };

  const renderProjectCard = (projeto: any) => (
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
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} projeto(s) encontrado(s)</p>
        </div>
        <div className="flex gap-2">
          {isCoordination && (
            <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" /> Categorias
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerenciar Categorias</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={newCatCor}
                      onChange={(e) => setNewCatCor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Button onClick={saveCat} size="sm">
                      {editingCat ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                  {editingCat && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditingCat(null); setNewCatName(""); setNewCatCor("#6366f1"); }}>
                      Cancelar edição
                    </Button>
                  )}
                  <div className="space-y-2">
                    {categorias.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 p-2 rounded border">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.cor || "#6366f1" }} />
                        <span className="flex-1 text-sm font-medium">{cat.nome}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(cat); setNewCatName(cat.nome); setNewCatCor(cat.cor || "#6366f1"); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCat(cat.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {categorias.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada</p>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" asChild>
            <Link to="/importar-projetos">
              <FileStack className="h-4 w-4 mr-2" /> Importar em Massa
            </Link>
          </Button>
          <Button asChild>
            <Link to="/novo-projeto">
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {categorias.length > 0 && (
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="sem_categoria">Sem Categoria</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || "#6366f1" }} />
                    {c.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        {centrosCusto.length > 0 && (
          <Select value={filterCC} onValueChange={setFilterCC}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os CC</SelectItem>
              {centrosCusto.map((cc) => (
                <SelectItem key={cc} value={cc}>{cc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Project List - Grouped by Category */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum projeto encontrado. Crie um novo projeto para começar.
            </CardContent>
          </Card>
        ) : (
          grouped.map((group) => {
            const catId = group.categoria?.id || "__none__";
            const isCollapsed = collapsedCats.has(catId);

            if (!group.categoria) {
              // Uncategorized projects - render flat if there are categories, otherwise just list
              if (categorias.length === 0) {
                return (
                  <div key="__none__" className="grid gap-4">
                    {group.projetos.map(renderProjectCard)}
                  </div>
                );
              }
              return (
                <Collapsible key="__none__" open={!isCollapsed} onOpenChange={() => toggleCollapse("__none__")}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-1 hover:bg-muted/50 rounded transition-colors">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">Sem Categoria</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{group.projetos.length}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-3 mt-2 ml-6">
                      {group.projetos.map(renderProjectCard)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Collapsible key={catId} open={!isCollapsed} onOpenChange={() => toggleCollapse(catId)}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-1 hover:bg-muted/50 rounded transition-colors">
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: group.categoria.cor || "#6366f1" }} />
                  <span className="text-sm font-semibold">{group.categoria.nome}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{group.projetos.length}</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-3 mt-2 ml-6">
                    {group.projetos.map(renderProjectCard)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
