import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UserAvatar from "@/components/UserAvatar";

interface Profile {
  id: string;
  nome: string;
  avatar_url?: string | null;
}

interface ContatoExterno {
  id: string;
  nome: string;
  organizacao?: string | null;
}

interface ResponsavelComboboxProps {
  profiles: Profile[];
  contatosExternos: ContatoExterno[];
  value: string; // profile id, "ext:<id>", or ""
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  showAddExterno?: boolean;
}

export default function ResponsavelCombobox({
  profiles,
  contatosExternos,
  value,
  onValueChange,
  placeholder = "Selecione o responsável",
  className,
  triggerClassName,
  showAddExterno = true,
}: ResponsavelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const normalizedSearch = search.toLowerCase().trim();

  const filteredProfiles = profiles.filter((p) =>
    p.nome.toLowerCase().includes(normalizedSearch)
  );

  const filteredExternos = contatosExternos.filter(
    (c) =>
      c.nome.toLowerCase().includes(normalizedSearch) ||
      (c.organizacao && c.organizacao.toLowerCase().includes(normalizedSearch))
  );

  // Resolve display label
  let displayLabel = placeholder;
  if (value) {
    if (value.startsWith("ext:")) {
      const extId = value.replace("ext:", "");
      const ext = contatosExternos.find((c) => c.id === extId);
      displayLabel = ext ? ext.nome : "Externo";
    } else if (value !== "__novo_externo__") {
      const prof = profiles.find((p) => p.id === value);
      displayLabel = prof ? prof.nome : placeholder;
    }
  }

  const isPlaceholder = displayLabel === placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            isPlaceholder && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", className)} align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[260px] overflow-y-auto p-1">
          {filteredProfiles.length === 0 && filteredExternos.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          )}

          {filteredProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onValueChange(p.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground",
                value === p.id && "bg-accent"
              )}
            >
              <UserAvatar avatarUrl={p.avatar_url} nome={p.nome} className="h-5 w-5" />
              <span className="truncate">{p.nome}</span>
              {value === p.id && <Check className="ml-auto h-4 w-4" />}
            </button>
          ))}

          {filteredExternos.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                Contatos Externos
              </div>
              {filteredExternos.map((c) => (
                <button
                  key={`ext:${c.id}`}
                  onClick={() => {
                    onValueChange(`ext:${c.id}`);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground",
                    value === `ext:${c.id}` && "bg-accent"
                  )}
                >
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.nome}</span>
                  {c.organizacao && (
                    <span className="text-xs text-muted-foreground">({c.organizacao})</span>
                  )}
                  {value === `ext:${c.id}` && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </>
          )}

          {showAddExterno && (
            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => {
                  onValueChange("__novo_externo__");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-default text-primary hover:bg-accent"
              >
                <UserPlus className="h-4 w-4" />
                <span>Adicionar pessoa externa...</span>
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
