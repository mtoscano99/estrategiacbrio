import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedContact {
  nome: string;
  email: string;
  selected: boolean;
  duplicate?: boolean;
}

export default function ImportarContatosDialog() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const detectColumn = (headers: string[], patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.toLowerCase().replace(/[^a-z]/g, "").includes(p)));

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rows.length < 2) {
        toast.error("Planilha vazia ou sem dados");
        setLoading(false);
        return;
      }

      const headers = rows[0].map(String);
      const nameCol = detectColumn(headers, ["nome", "name", "nomecompleto", "fullname"]);
      const emailCol = detectColumn(headers, ["email", "emailaddress", "correio", "mail"]);

      if (nameCol === -1 || emailCol === -1) {
        toast.error("Não foi possível detectar as colunas de nome e email. Verifique os cabeçalhos da planilha.");
        setLoading(false);
        return;
      }

      // Check existing emails
      const { data: existing } = await supabase.from("contatos_externos").select("email");
      const existingEmails = new Set((existing || []).map((c) => c.email?.toLowerCase()));

      const parsed: ParsedContact[] = rows
        .slice(1)
        .filter((row) => row[nameCol] && row[emailCol])
        .map((row) => {
          const email = String(row[emailCol]).trim();
          return {
            nome: String(row[nameCol]).trim(),
            email,
            selected: true,
            duplicate: existingEmails.has(email.toLowerCase()),
          };
        });

      if (parsed.length === 0) {
        toast.error("Nenhum contato válido encontrado na planilha");
        setLoading(false);
        return;
      }

      // Auto-deselect duplicates
      parsed.forEach((c) => { if (c.duplicate) c.selected = false; });
      setContacts(parsed);
    } catch {
      toast.error("Erro ao ler o arquivo");
    }
    setLoading(false);
    e.target.value = "";
  }, []);

  const toggleAll = () => {
    const nonDuplicates = contacts.filter((c) => !c.duplicate);
    const allSelected = nonDuplicates.every((c) => c.selected);
    setContacts(contacts.map((c) => (c.duplicate ? c : { ...c, selected: !allSelected })));
  };

  const toggle = (idx: number) => {
    setContacts(contacts.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c)));
  };

  const handleImport = async () => {
    const toImport = contacts.filter((c) => c.selected && !c.duplicate);
    if (toImport.length === 0) { toast.error("Nenhum contato selecionado"); return; }

    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Usuário não autenticado"); setImporting(false); return; }

    const { error } = await supabase.from("contatos_externos").insert(
      toImport.map((c) => ({ nome: c.nome, email: c.email, criado_por: user.id }))
    );

    if (error) {
      toast.error("Erro ao importar contatos");
    } else {
      toast.success(`${toImport.length} contato(s) importado(s) com sucesso!`);
      setContacts([]);
      setOpen(false);
    }
    setImporting(false);
  };

  const selectedCount = contacts.filter((c) => c.selected && !c.duplicate).length;
  const duplicateCount = contacts.filter((c) => c.duplicate).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setContacts([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" /> Importar Pessoas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Contatos de Planilha</DialogTitle>
        </DialogHeader>

        {contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Selecione um arquivo XLSX ou CSV com colunas <strong>Nome</strong> e <strong>Email</strong>
            </p>
            <label className="cursor-pointer">
              <Button variant="outline" asChild disabled={loading}>
                <span>{loading ? "Lendo..." : "Selecionar Arquivo"}</span>
              </Button>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">{contacts.length} encontrado(s)</Badge>
                <Badge variant="default">{selectedCount} selecionado(s)</Badge>
                {duplicateCount > 0 && (
                  <Badge variant="outline" className="text-amber-600">
                    <AlertCircle className="h-3 w-3 mr-1" /> {duplicateCount} duplicado(s)
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                Selecionar/Desmarcar Todos
              </Button>
            </div>

            <div className="overflow-auto flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c, i) => (
                    <TableRow key={i} className={c.duplicate ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={c.selected}
                          disabled={c.duplicate}
                          onCheckedChange={() => toggle(i)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell>
                        {c.duplicate ? (
                          <Badge variant="outline" className="text-amber-600 text-xs">Duplicado</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Novo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContacts([])}>Voltar</Button>
              <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
                {importing ? "Importando..." : `Importar ${selectedCount} contato(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
