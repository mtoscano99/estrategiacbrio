import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FilePlus } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

export default function NovoProjeto() {
  const navigate = useNavigate();
  const { user, isCoordination } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    justificativa: "",
    objetivo_id: "",
    area_id: "",
    responsavel_id: "",
    data_inicio: "",
    data_fim: "",
    estimativa_prazo: "",
    estimativa_orcamento: "",
    entregas_esperadas: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("areas_estrategicas").select("id, nome"),
      supabase.from("objetivos_estrategicos").select("id, titulo, ano"),
      supabase.from("profiles").select("id, nome, avatar_url"),
    ]).then(([areasRes, objRes, profilesRes]) => {
      if (areasRes.data) setAreas(areasRes.data);
      if (objRes.data) setObjetivos(objRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isCoordination) {
        const { error } = await supabase.from("projetos").insert({
          nome: form.titulo,
          descricao: form.justificativa,
          area_id: form.area_id || null,
          objetivo_id: form.objetivo_id || null,
          responsavel_id: form.responsavel_id || user.id,
          data_inicio: form.data_inicio || null,
          data_fim: form.data_fim || null,
          orcamento_previsto: form.estimativa_orcamento ? Number(form.estimativa_orcamento) : 0,
        });
        if (error) throw error;
        toast.success("Projeto criado com sucesso!");
        navigate("/projetos");
      } else {
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
    <div className="max-w-3xl mx-auto animate-fade-in">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1 - Informações Gerais */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
              <div className="space-y-4">
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
              </div>
            </div>

            <Separator />

            {/* Seção 2 - Planejamento */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Planejamento</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    {isCoordination ? (
                      <Select value={form.responsavel_id} onValueChange={(v) => update("responsavel_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <UserAvatar avatarUrl={p.avatar_url} nome={p.nome} className="h-5 w-5" />
                                <span>{p.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value="Você (proponente)" disabled />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo">Estimativa de Prazo</Label>
                    <Input id="prazo" value={form.estimativa_prazo} onChange={(e) => update("estimativa_prazo", e.target.value)} placeholder="Ex: 6 meses" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input id="data_inicio" type="date" value={form.data_inicio} onChange={(e) => update("data_inicio", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim</Label>
                    <Input id="data_fim" type="date" value={form.data_fim} onChange={(e) => update("data_fim", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção 3 - Financeiro */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Financeiro</h2>
              <div className="space-y-2">
                <Label htmlFor="orcamento">Orçamento Previsto (R$)</Label>
                <Input id="orcamento" type="number" value={form.estimativa_orcamento} onChange={(e) => update("estimativa_orcamento", e.target.value)} placeholder="0,00" />
              </div>
            </div>

            <Separator />

            {/* Seção 4 - Entregas */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Entregas</h2>
              <div className="space-y-2">
                <Label htmlFor="entregas">Entregas Esperadas</Label>
                <Textarea id="entregas" value={form.entregas_esperadas} onChange={(e) => update("entregas_esperadas", e.target.value)} placeholder="Liste as entregas esperadas do projeto..." rows={3} />
              </div>
            </div>

            <Separator />

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
