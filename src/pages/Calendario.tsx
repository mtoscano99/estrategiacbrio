import { useState, useEffect, useMemo, useCallback } from "react";
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
  isBefore,
  startOfDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import NovaEtapaCalendarioDialog from "@/components/calendario/NovaEtapaCalendarioDialog";

interface CalendarEvent {
  id: string;
  projetoId: string;
  nome: string;
  tipo: "projeto" | "etapa";
  areaId: string | null;
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
  const [areas, setAreas] = useState<{ id: string; nome: string }[]>([]);
  const [filterArea, setFilterArea] = useState("all");
  const [filterTipo, setFilterTipo] = useState<"all" | "projeto" | "etapa">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
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
    supabase.from("areas_estrategicas").select("id, nome").then(({ data }) => {
      if (data) setAreas(data);
    });
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const allEvents: CalendarEvent[] = [];

    let projQuery = supabase
      .from("projetos")
      .select("id, nome, data_inicio, data_fim, status, area_id");
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
            areaId: p.area_id,
          });
        }
      }
    }

    let etapaQuery = supabase
      .from("etapas_projeto")
      .select("id, nome, data_inicio, data_fim, status, projeto_id, projetos(nome, area_id)");
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
            areaId: (e as any).projetos?.area_id ?? null,
          });
        }
      }
    }

    setEvents(allEvents);
    setLoading(false);
  }, [user, isCoordination]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterTipo !== "all" && ev.tipo !== filterTipo) return false;
      if (filterArea !== "all" && ev.areaId !== filterArea) return false;
      return true;
    });
  }, [events, filterTipo, filterArea]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((ev) => {
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

  const isEventOverdue = (ev: CalendarEvent) => {
    return (
      ev.status !== "concluido" &&
      ev.dataFim &&
      isBefore(parseISO(ev.dataFim), startOfDay(new Date()))
    );
  };

  const getEventStyle = (ev: CalendarEvent) => {
    if (ev.tipo === "projeto") {
      const overdue = isEventOverdue(ev);
      if (overdue) return "bg-red-100 text-red-800 border-l-2 border-red-500 dark:bg-red-900/30 dark:text-red-300";
      return "bg-blue-100 text-blue-800 border-l-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300";
    }
    if (isEventOverdue(ev)) {
      return "bg-red-100 text-red-800 border-l-2 border-red-500 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300";
  };

  const getDotColor = (ev: CalendarEvent) => {
    if (isEventOverdue(ev)) return "bg-red-500";
    if (ev.tipo === "projeto") return "bg-blue-500";
    return "bg-emerald-500";
  };

  const MAX_VISIBLE = 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDay(today);
            }}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as any)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="projeto">Projetos</SelectItem>
            <SelectItem value="etapa">Etapas / Marcos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Área estratégica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterTipo !== "all" || filterArea !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setFilterTipo("all"); setFilterArea("all"); }}>
            Limpar filtros
          </Button>
        )}
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
                      setSelectedDay(isSelected ? null : day)
                    }
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setCreateDate(day);
                      setCreateDialogOpen(true);
                    }}
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

      <NovaEtapaCalendarioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedDate={createDate}
        onCreated={fetchEvents}
      />
    </div>
  );
}
