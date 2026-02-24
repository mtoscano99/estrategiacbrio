import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Shield, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

type SwotTipo = "forca" | "fraqueza" | "oportunidade" | "ameaca";

interface SwotItem {
  id: string;
  tipo: SwotTipo;
  descricao: string;
}

const QUADRANTES: {
  tipo: SwotTipo;
  label: string;
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  iconClass: string;
}[] = [
  { tipo: "forca", label: "Forças", icon: Shield, bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30", iconClass: "text-emerald-600" },
  { tipo: "fraqueza", label: "Fraquezas", icon: TrendingDown, bgClass: "bg-red-500/10", borderClass: "border-red-500/30", iconClass: "text-red-600" },
  { tipo: "oportunidade", label: "Oportunidades", icon: TrendingUp, bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30", iconClass: "text-blue-600" },
  { tipo: "ameaca", label: "Ameaças", icon: AlertTriangle, bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30", iconClass: "text-amber-600" },
];

interface SWOTMatrixProps {
  projetoId: string;
}

export default function SWOTMatrix({ projetoId }: SWOTMatrixProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<SwotItem[]>([]);
  const [newTexts, setNewTexts] = useState<Record<SwotTipo, string>>({
    forca: "", fraqueza: "", oportunidade: "", ameaca: "",
  });

  useEffect(() => {
    loadItems();
  }, [projetoId]);

  const loadItems = async () => {
    const { data } = await supabase
      .from("swot_items")
      .select("id, tipo, descricao")
      .eq("projeto_id", projetoId)
      .order("created_at");
    if (data) setItems(data as SwotItem[]);
  };

  const addItem = async (tipo: SwotTipo) => {
    const text = newTexts[tipo].trim();
    if (!text || !user) return;
    const { error } = await supabase.from("swot_items").insert({
      projeto_id: projetoId,
      tipo,
      descricao: text,
      criado_por: user.id,
    } as any);
    if (error) { toast.error("Erro ao adicionar item"); return; }
    setNewTexts((prev) => ({ ...prev, [tipo]: "" }));
    loadItems();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("swot_items").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover item"); return; }
    loadItems();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Análise SWOT</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTES.map(({ tipo, label, icon: Icon, bgClass, borderClass, iconClass }) => {
            const quadItems = items.filter((i) => i.tipo === tipo);
            return (
              <div key={tipo} className={`rounded-lg border p-4 ${bgClass} ${borderClass}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-5 w-5 ${iconClass}`} />
                  <h4 className="font-semibold text-sm">{label}</h4>
                </div>
                <ul className="space-y-1.5 mb-3 min-h-[32px]">
                  {quadItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5 group text-sm">
                      <span className="flex-1">{item.descricao}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                  {quadItems.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">Nenhum item</li>
                  )}
                </ul>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Novo item..."
                    value={newTexts[tipo]}
                    onChange={(e) => setNewTexts((prev) => ({ ...prev, [tipo]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addItem(tipo)}
                    className="h-8 text-xs bg-background/60"
                  />
                  <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => addItem(tipo)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
