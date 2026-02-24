import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  isPast,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  projetoId: string;
  nome: string;
  tipo: "projeto" | "etapa";
  dataInicio: string | null;
  dataFim: string | null;
  status: string;
  projetoNome?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isCoordination } = useAuth();
  const navigate = useNavigate();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      setLoading(true);
      const allEvents: CalendarEvent[] = [];

      // Fetch projetos
      let projQuery = supabase
        .from("projetos")
        .select("id, nome, data_inicio, data_fim, status");
      if (!isCoordination) {
        projQuery = projQuery.eq("responsavel_id", user.id);
      }
      const { data: projetos } = await projQuery;
      if (projetos) {
        for (const p of projetos) {
          if (p.data_inicio || p.data_fim) {
            allEvents.push({
              id: `proj-${p.id}`,
              projetoId: p.id,
              nome: p.nome,
              tipo: "projeto",
              dataInicio: p.data_inicio,
              dataFim: p.data_fim,
              status: p.status,
            });
          }
        }
      }

      // Fetch etapas
      let etapaQuery = supabase
        .from("etapas_projeto")
        .select("id, nome, data_inicio, data_fim, status, projeto_id, projetos(nome)");
      if (!isCoordination) {
        etapaQuery = etapaQuery.eq("responsavel_id", user.id);
      }
      const { data: etapas } = await etapaQuery;
      if (etapas) {
        for (const e of etapas) {
          if (e.data_inicio || e.data_fim) {
            allEvents.push({
              id: `etapa-${e.id}`,
              projetoId: e.projeto_id,
              nome: e.nome,
              tipo: "etapa",
              dataInicio: e.data_inicio,
              dataFim: e.data_fim,
              status: e.status,
              projetoNome: (e as any).projetos?.nome,
            });
          }
        }
      }

      setEvents(allEvents);
      setLoading(false);
    };
    fetchEvents();
  }, [user, isCoordination, currentDate]);

  const getEventsForDay = (day: Date) => {
    return events.filter((ev) => {
      const start = ev.dataInicio ? parseISO(ev.dataInicio) : null;
      const end = ev.dataFim ? parseISO(ev.dataFim) : null;

      if (start && end) {
        return isWithinInterval(day, { start, end });
      }
      if (start) return isSameDay(day, start);
      if (end) return isSameDay(day, end);
      return false;
    });
  };

  const getEventStyle = (ev: CalendarEvent) => {
    if (ev.tipo === "projeto") {
      return "bg-blue-100 text-blue-800 border-l-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300";
    }
    const isOverdue =
      ev.status !== "concluido" && ev.dataFim && isPast(parseISO(ev.dataFim));
    if (isOverdue) {
      return "bg-red-100 text-red-800 border-l-2 border-red-500 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300";
  };

  const getDotColor = (ev: CalendarEvent) => {
    if (ev.tipo === "projeto") return "bg-blue-500";
    const isOverdue =
      ev.status !== "concluido" && ev.dataFim && isPast(parseISO(ev.dataFim));
    return isOverdue ? "bg-red-500" : "bg-emerald-500";
  };

  const MAX_VISIBLE = 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Calendário
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground ml-2 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Carregando calendário...
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-muted/50">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border p-1 cursor-pointer transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      today && "bg-primary/5",
                      isSelected && "ring-2 ring-inset ring-primary"
                    )}
                    onClick={() =>
                      setSelectedDay(
                        isSelected ? null : day
                      )
                    }
                  >
                    <div
                      className={cn(
                        "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                        today
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {format(day, "d")}
                    </div>

                    {/* Desktop: event pills */}
                    <div className="hidden sm:flex flex-col gap-0.5">
                      {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                        <Tooltip key={ev.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projetos/${ev.projetoId}`);
                              }}
                              className={cn(
                                "text-[10px] leading-tight px-1 py-0.5 rounded truncate text-left w-full hover:opacity-80 transition-opacity",
                                getEventStyle(ev)
                              )}
                            >
                              {ev.nome}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="font-medium text-xs">{ev.nome}</p>
                            {ev.projetoNome && (
                              <p className="text-[10px] text-muted-foreground">
                                Projeto: {ev.projetoNome}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {ev.tipo} · {ev.status.replace("_", " ")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayEvents.length > MAX_VISIBLE && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 w-fit"
                        >
                          +{dayEvents.length - MAX_VISIBLE} mais
                        </Badge>
                      )}
                    </div>

                    {/* Mobile: dots */}
                    <div className="flex sm:hidden gap-0.5 flex-wrap">
                      {dayEvents.slice(0, 5).map((ev) => (
                        <div
                          key={ev.id}
                          className={cn("w-1.5 h-1.5 rounded-full", getDotColor(ev))}
                        />
                      ))}
                      {dayEvents.length > 5 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayEvents.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day detail (mobile-friendly) */}
          {selectedDay && (
            <div className="border border-border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-foreground capitalize">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              {getEventsForDay(selectedDay).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento neste dia.
                </p>
              ) : (
                <div className="space-y-1">
                  {getEventsForDay(selectedDay).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/projetos/${ev.projetoId}`)}
                      className={cn(
                        "w-full text-left text-sm px-3 py-2 rounded-md hover:opacity-80 transition-opacity",
                        getEventStyle(ev)
                      )}
                    >
                      <span className="font-medium">{ev.nome}</span>
                      {ev.projetoNome && (
                        <span className="text-xs ml-2 opacity-75">
                          ({ev.projetoNome})
                        </span>
                      )}
                      <span className="text-xs ml-2 capitalize opacity-60">
                        {ev.tipo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
