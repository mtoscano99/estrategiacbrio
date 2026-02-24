import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Shield, AlertTriangle, TrendingUp, TrendingDown, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SwotTipo = "forca" | "fraqueza" | "oportunidade" | "ameaca";

interface SwotItem {
  id: string;
  tipo: SwotTipo;
  descricao: string;
}

interface SwotSuggestion {
  text: string;
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
  projectContext?: any;
}

export default function SWOTMatrix({ projetoId, projectContext }: SWOTMatrixProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<SwotItem[]>([]);
  const [newTexts, setNewTexts] = useState<Record<SwotTipo, string>>({
    forca: "", fraqueza: "", oportunidade: "", ameaca: "",
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<SwotTipo, boolean>>({
    forca: false, fraqueza: false, oportunidade: false, ameaca: false,
  });
  const [suggestions, setSuggestions] = useState<Record<SwotTipo, SwotSuggestion[]>>({
    forca: [], fraqueza: [], oportunidade: [], ameaca: [],
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

  const addItem = async (tipo: SwotTipo, text?: string) => {
    const desc = text || newTexts[tipo].trim();
    if (!desc || !user) return;
    const { error } = await supabase.from("swot_items").insert({
      projeto_id: projetoId,
      tipo,
      descricao: desc,
      criado_por: user.id,
    } as any);
    if (error) { toast.error("Erro ao adicionar item"); return; }
    if (!text) setNewTexts((prev) => ({ ...prev, [tipo]: "" }));
    loadItems();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("swot_items").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover item"); return; }
    loadItems();
  };

  const suggestWithAI = async (tipo: SwotTipo) => {
    if (!projectContext) {
      toast.error("Contexto do projeto não disponível");
      return;
    }
    setLoadingSuggestions((prev) => ({ ...prev, [tipo]: true }));
    setSuggestions((prev) => ({ ...prev, [tipo]: [] }));

    try {
      const quadItems = items.filter((i) => i.tipo === tipo).map((i) => i.descricao);
      const resp = await supabase.functions.invoke("ai-project-assistant", {
        body: {
          mode: "swot",
          context: { ...projectContext, tipo, existingItems: quadItems },
        },
      });

      if (resp.error) throw new Error(resp.error.message);
      const data = resp.data;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setSuggestions((prev) => ({ ...prev, [tipo]: data?.suggestions || [] }));
    } catch (e: any) {
      toast.error(e.message || "Erro ao obter sugestões");
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  const acceptSuggestion = async (tipo: SwotTipo, index: number) => {
    const s = suggestions[tipo][index];
    await addItem(tipo, s.text);
    setSuggestions((prev) => ({
      ...prev,
      [tipo]: prev[tipo].filter((_, i) => i !== index),
    }));
    toast.success("Item adicionado");
  };

  const dismissSuggestion = (tipo: SwotTipo, index: number) => {
    setSuggestions((prev) => ({
      ...prev,
      [tipo]: prev[tipo].filter((_, i) => i !== index),
    }));
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
            const tipSuggestions = suggestions[tipo];
            const isLoading = loadingSuggestions[tipo];
            return (
              <div key={tipo} className={`rounded-lg border p-4 ${bgClass} ${borderClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${iconClass}`} />
                    <h4 className="font-semibold text-sm">{label}</h4>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => suggestWithAI(tipo)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Sugerir
                  </Button>
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
                  {quadItems.length === 0 && tipSuggestions.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">Nenhum item</li>
                  )}
                </ul>

                {/* AI Suggestions */}
                {tipSuggestions.length > 0 && (
                  <div className="space-y-1.5 mb-3 border-t border-dashed pt-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Sugestões da IA
                    </p>
                    {tipSuggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-sm bg-background/40 rounded px-2 py-1">
                        <span className="flex-1">{s.text}</span>
                        <button onClick={() => acceptSuggestion(tipo, i)} className="text-emerald-600 hover:text-emerald-700 shrink-0">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => dismissSuggestion(tipo, i)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
