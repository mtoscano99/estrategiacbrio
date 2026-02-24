import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface NovaEtapaCalendarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onCreated: () => void;
}

export default function NovaEtapaCalendarioDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}: NovaEtapaCalendarioDialogProps) {
  const { user, isCoordination } = useAuth();
  const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const fetchProjetos = async () => {
      let query = supabase.from("projetos").select("id, nome").order("nome");
      if (!isCoordination) {
        query = query.eq("responsavel_id", user.id);
      }
      const { data } = await query;
      if (data) setProjetos(data);
    };
    fetchProjetos();
  }, [open, user, isCoordination]);

  useEffect(() => {
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      setDataInicio(formatted);
      setDataFim(formatted);
    }
  }, [selectedDate]);

  const handleClose = () => {
    onOpenChange(false);
    setNome("");
    setDescricao("");
    setProjetoId("");
    setDataInicio("");
    setDataFim("");
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !projetoId) {
      toast({ title: "Preencha o nome e selecione um projeto", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Get max ordem for this project
    const { data: maxOrdem } = await supabase
      .from("etapas_projeto")
      .select("ordem")
      .eq("projeto_id", projetoId)
      .order("ordem", { ascending: false })
      .limit(1);

    const nextOrdem = maxOrdem && maxOrdem.length > 0 ? (maxOrdem[0].ordem ?? 0) + 1 : 0;

    const { error } = await supabase.from("etapas_projeto").insert({
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      projeto_id: projetoId,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      responsavel_id: user?.id,
      ordem: nextOrdem,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar etapa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Etapa criada com sucesso" });
      handleClose();
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nova Etapa
            {selectedDate && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Projeto *</Label>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome da etapa *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Revisão de documentação" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label>Data fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Criando..." : "Criar etapa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
