import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().max(1000).optional(),
  unidade: z.string().min(1, "Unidade é obrigatória").max(50),
  meta: z.coerce.number().min(0, "Meta deve ser positiva"),
  area_id: z.string().optional(),
  objetivo_id: z.string().optional(),
  periodicidade: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onCreated: () => void;
}

export function NovoKPIDialog({ onCreated }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [areas, setAreas] = useState<{ id: string; nome: string }[]>([]);
  const [objetivos, setObjetivos] = useState<{ id: string; titulo: string; area_id: string | null }[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unidade: "%", periodicidade: "mensal", meta: 0 },
  });

  const selectedArea = watch("area_id");

  useEffect(() => {
    if (open) {
      supabase.from("areas_estrategicas").select("id, nome").order("nome").then(({ data }) => data && setAreas(data));
      supabase.from("objetivos_estrategicos").select("id, titulo, area_id").order("titulo").then(({ data }) => data && setObjetivos(data));
    }
  }, [open]);

  const filteredObjetivos = selectedArea
    ? objetivos.filter((o) => o.area_id === selectedArea)
    : objetivos;

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.from("kpis").insert({
      nome: values.nome,
      descricao: values.descricao || null,
      unidade: values.unidade,
      meta: values.meta,
      area_id: values.area_id || null,
      objetivo_id: values.objetivo_id || null,
      periodicidade: values.periodicidade,
      criado_por: user?.id || null,
    } as any);

    if (error) {
      toast({ title: "Erro ao criar KPI", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "KPI criado com sucesso!" });
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Novo KPI</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar novo KPI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} placeholder="Ex: Frequência Presencial" />
            {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea {...register("descricao")} placeholder="Descrição detalhada do indicador" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unidade *</Label>
              <Input {...register("unidade")} placeholder="%, R$, unidades" />
            </div>
            <div>
              <Label>Meta *</Label>
              <Input type="number" step="any" {...register("meta")} />
              {errors.meta && <p className="text-sm text-destructive mt-1">{errors.meta.message}</p>}
            </div>
          </div>
          <div>
            <Label>Periodicidade</Label>
            <Select defaultValue="mensal" onValueChange={(v) => setValue("periodicidade", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Área Estratégica</Label>
            <Select onValueChange={(v) => setValue("area_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Objetivo Estratégico</Label>
            <Select onValueChange={(v) => setValue("objetivo_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {filteredObjetivos.map((o) => <SelectItem key={o.id} value={o.id}>{o.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar KPI"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
