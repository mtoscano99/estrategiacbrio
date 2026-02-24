import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FilePlus } from "lucide-react";

export default function NovoProjeto() {
  const navigate = useNavigate();
  const { user, isCoordination } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    justificativa: "",
    objetivo_id: "",
    area_id: "",
    estimativa_prazo: "",
    estimativa_orcamento: "",
    entregas_esperadas: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("areas_estrategicas").select("id, nome"),
      supabase.from("objetivos_estrategicos").select("id, titulo, ano"),
    ]).then(([areasRes, objRes]) => {
      if (areasRes.data) setAreas(areasRes.data);
      if (objRes.data) setObjetivos(objRes.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isCoordination) {
        // Coordenação cria projeto diretamente
        const { error } = await supabase.from("projetos").insert({
          nome: form.titulo,
          descricao: form.justificativa,
          area_id: form.area_id || null,
          objetivo_id: form.objetivo_id || null,
          responsavel_id: user.id,
          orcamento_previsto: form.estimativa_orcamento ? Number(form.estimativa_orcamento) : 0,
        });
        if (error) throw error;
        toast.success("Projeto criado com sucesso!");
        navigate("/projetos");
      } else {
        // Líder de área submete proposta
        const { error } = await supabase.from("propostas_projeto").insert({
          titulo: form.titulo,
          justificativa: form.justificativa,
          objetivo_id: form.objetivo_id || null,
          area_id: form.area_id || null,
          proponente_id: user.id,
          estimativa_prazo: form.estimativa_prazo,
          estimativa_orcamento: form.estimativa_orcamento ? Number(form.estimativa_orcamento) : null,
          entregas_esperadas: form.entregas_esperadas,
        });
        if (error) throw error;
        toast.success("Proposta enviada para aprovação!");
        navigate("/projetos");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <FilePlus className="h-6 w-6 text-primary" />
          {isCoordination ? "Novo Projeto" : "Propor Projeto"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isCoordination ? "Crie um novo projeto diretamente no portfólio" : "Submeta uma proposta de projeto para aprovação da coordenação"}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Projeto *</Label>
              <Input id="titulo" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} placeholder="Nome do projeto" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">{isCoordination ? "Descrição" : "Justificativa"} *</Label>
              <Textarea id="justificativa" value={form.justificativa} onChange={(e) => update("justificativa", e.target.value)} placeholder="Descreva o projeto e sua justificativa..." required rows={4} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Área Estratégica</Label>
                <Select value={form.area_id} onValueChange={(v) => update("area_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo Estratégico</Label>
                <Select value={form.objetivo_id} onValueChange={(v) => update("objetivo_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {objetivos.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.titulo} ({o.ano})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prazo">Estimativa de Prazo</Label>
                <Input id="prazo" value={form.estimativa_prazo} onChange={(e) => update("estimativa_prazo", e.target.value)} placeholder="Ex: 6 meses" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento">Estimativa de Orçamento (R$)</Label>
                <Input id="orcamento" type="number" value={form.estimativa_orcamento} onChange={(e) => update("estimativa_orcamento", e.target.value)} placeholder="0,00" />
              </div>
            </div>

            {!isCoordination && (
              <div className="space-y-2">
                <Label htmlFor="entregas">Entregas Esperadas</Label>
                <Textarea id="entregas" value={form.entregas_esperadas} onChange={(e) => update("entregas_esperadas", e.target.value)} placeholder="Liste as entregas esperadas do projeto..." rows={3} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : isCoordination ? "Criar Projeto" : "Enviar Proposta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
