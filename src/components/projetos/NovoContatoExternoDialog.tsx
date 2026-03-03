import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NovoContatoExternoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (contato: { id: string; nome: string; email?: string; cargo?: string; organizacao?: string }) => void;
}

export default function NovoContatoExternoDialog({ open, onOpenChange, onCreated }: NovoContatoExternoDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", cargo: "", organizacao: "", telefone: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("contatos_externos").insert({
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        cargo: form.cargo.trim() || null,
        organizacao: form.organizacao.trim() || null,
        telefone: form.telefone.trim() || null,
        criado_por: user.id,
      } as any).select("id, nome, email, cargo, organizacao").single();
      if (error) throw error;
      onCreated(data as any);
      setForm({ nome: "", email: "", cargo: "", organizacao: "", telefone: "" });
      onOpenChange(false);
      toast.success("Contato externo adicionado");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar contato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Pessoa Externa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" required />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Consultor" />
            </div>
            <div className="space-y-2">
              <Label>Organização</Label>
              <Input value={form.organizacao} onChange={(e) => setForm({ ...form, organizacao: e.target.value })} placeholder="Ex: Empresa X" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(21) 99999-9999" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
