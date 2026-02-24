import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Target, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SelecionarPerfil() {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { refreshRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast.error("Selecione um perfil para continuar.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-role", {
        body: { role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refreshRole();
      toast.success("Perfil definido com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao definir perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">CBRio</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina seu perfil de acesso</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Selecionar Perfil</CardTitle>
            <CardDescription>Escolha seu tipo de acesso ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <RadioGroup value={role} onValueChange={setRole} className="space-y-3">
                <label
                  htmlFor="role-coordenacao"
                  className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="coordenacao" id="role-coordenacao" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Coordenação</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visão completa do sistema, aprovação de propostas e gestão de todas as áreas.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="role-lider"
                  className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="lider_area" id="role-lider" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Líder de Área</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gestão de projetos da sua área, proposição de novos projetos e acompanhamento.
                    </p>
                  </div>
                </label>
              </RadioGroup>
              <Button type="submit" className="w-full" disabled={loading || !role}>
                {loading ? "Salvando..." : "Continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
