import { useState } from "react";
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
import { PlusCircle } from "lucide-react";

const schema = z.object({
  valor: z.coerce.number({ invalid_type_error: "Informe um número" }),
  data_referencia: z.string().min(1, "Data é obrigatória"),
  observacao: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  kpiId: string;
  kpiNome: string;
  unidade: string;
  onCreated: () => void;
  trigger?: React.ReactNode;
}

export function NovaMedicaoDialog({ kpiId, kpiNome, unidade, onCreated, trigger }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data_referencia: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.from("kpi_medicoes").insert({
      kpi_id: kpiId,
      valor: values.valor,
      data_referencia: values.data_referencia,
      observacao: values.observacao || null,
      registrado_por: user?.id || null,
    } as any);

    if (error) {
      toast({ title: "Erro ao registrar medição", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Medição registrada!" });
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-1" />Registrar Medição
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar medição — {kpiNome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Valor ({unidade}) *</Label>
            <Input type="number" step="any" {...register("valor")} />
            {errors.valor && <p className="text-sm text-destructive mt-1">{errors.valor.message}</p>}
          </div>
          <div>
            <Label>Data de Referência *</Label>
            <Input type="date" {...register("data_referencia")} />
            {errors.data_referencia && <p className="text-sm text-destructive mt-1">{errors.data_referencia.message}</p>}
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea {...register("observacao")} placeholder="Comentário opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
