import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X, MessageSquare, AlertTriangle, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  aprovacao: <Check className="h-4 w-4 text-emerald-500" />,
  rejeicao: <X className="h-4 w-4 text-destructive" />,
  comentario: <MessageSquare className="h-4 w-4 text-primary" />,
  atraso: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

export function NotificacoesDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const fetchNotificacoes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotificacoes(data as Notificacao[]);
  };

  useEffect(() => {
    fetchNotificacoes();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          setNotificacoes((prev) => [payload.new as Notificacao, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const marcarComoLida = async (notif: Notificacao) => {
    if (!notif.lida) {
      await supabase.from("notificacoes").update({ lida: true } as any).eq("id", notif.id);
      setNotificacoes((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)));
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;
    await supabase.from("notificacoes").update({ lida: true } as any).eq("usuario_id", user.id).eq("lida", false);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 z-50 bg-popover">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={marcarTodasComoLidas}>
              <CheckCheck className="h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma notificação</p>
          ) : (
            notificacoes.map((n) => (
              <button
                key={n.id}
                onClick={() => marcarComoLida(n)}
                className={`w-full text-left px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-2.5 ${
                  !n.lida ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">{TIPO_ICON[n.tipo] || <Bell className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</p>
                  {n.mensagem && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.mensagem}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.lida && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
