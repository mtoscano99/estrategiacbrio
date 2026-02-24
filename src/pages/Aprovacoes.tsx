import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckSquare, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export default function Aprovacoes() {
  const { user, isCoordination } = useAuth();
  const [propostas, setPropostas] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from("propostas_projeto")
      .select("*, areas_estrategicas(nome), profiles!propostas_projeto_proponente_id_fkey(nome), objetivos_estrategicos(titulo)")
      .order("created_at", { ascending: false });
    if (data) setPropostas(data);
  };

  const handleApproval = async (propostaId: string, status: "aprovado" | "rejeitado") => {
    if (!user) return;
    const proposta = propostas.find((p) => p.id === propostaId);

    const { error } = await supabase
      .from("propostas_projeto")
      .update({
        status,
        comentario_aprovacao: comentarios[propostaId] || null,
        aprovado_por: user.id,
      })
      .eq("id", propostaId);

    if (error) {
      toast.error("Erro ao processar aprovação");
      return;
    }

    // Se aprovado, cria o projeto automaticamente
    if (status === "aprovado" && proposta) {
      const { data: novoProjeto } = await supabase
        .from("projetos")
        .insert({
          nome: proposta.titulo,
          descricao: proposta.justificativa,
          area_id: proposta.area_id,
          objetivo_id: proposta.objetivo_id,
          responsavel_id: proposta.proponente_id,
          orcamento_previsto: proposta.estimativa_orcamento || 0,
        })
        .select("id")
        .single();

      if (novoProjeto) {
        await supabase
          .from("propostas_projeto")
          .update({ projeto_gerado_id: novoProjeto.id })
          .eq("id", propostaId);
      }
    }

    toast.success(status === "aprovado" ? "Proposta aprovada!" : "Proposta rejeitada");
    loadData();
  };

  if (!isCoordination) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Acesso restrito à coordenação
      </div>
    );
  }

  const pendentes = propostas.filter((p) => p.status === "pendente");
  const processadas = propostas.filter((p) => p.status !== "pendente");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          Aprovações
        </h1>
        <p className="text-muted-foreground mt-1">{pendentes.length} proposta(s) pendente(s)</p>
      </div>

      {/* Pendentes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" /> Pendentes
        </h2>
        {pendentes.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma proposta pendente</CardContent></Card>
        ) : (
          pendentes.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{p.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>Por: {p.profiles?.nome}</span>
                      {p.areas_estrategicas?.nome && <Badge variant="secondary">{p.areas_estrategicas.nome}</Badge>}
                      <span>{format(new Date(p.created_at), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Pendente</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.justificativa}</p>
                {p.estimativa_orcamento && (
                  <p className="text-sm"><span className="font-medium">Orçamento estimado:</span> {Number(p.estimativa_orcamento).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                )}
                {p.entregas_esperadas && (
                  <p className="text-sm"><span className="font-medium">Entregas:</span> {p.entregas_esperadas}</p>
                )}
                <Textarea
                  placeholder="Comentário (opcional)..."
                  value={comentarios[p.id] || ""}
                  onChange={(e) => setComentarios({ ...comentarios, [p.id]: e.target.value })}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleApproval(p.id, "aprovado")} className="bg-success hover:bg-success/90">
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button variant="destructive" onClick={() => handleApproval(p.id, "rejeitado")}>
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Processadas */}
      {processadas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico</h2>
          {processadas.map((p) => (
            <Card key={p.id} className="opacity-80">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{p.titulo}</h3>
                    <p className="text-sm text-muted-foreground">Por: {p.profiles?.nome} • {format(new Date(p.created_at), "dd/MM/yyyy")}</p>
                  </div>
                  <Badge variant={p.status === "aprovado" ? "default" : "destructive"}>
                    {STATUS_LABELS[p.status]}
                  </Badge>
                </div>
                {p.comentario_aprovacao && <p className="text-sm mt-2 text-muted-foreground italic">"{p.comentario_aprovacao}"</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
