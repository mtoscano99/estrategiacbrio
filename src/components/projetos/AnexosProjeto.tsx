import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Paperclip, Upload, Trash2, FileText, Image, FileSpreadsheet, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Anexo {
  id: string;
  projeto_id: string;
  nome_arquivo: string;
  tamanho: number | null;
  tipo_mime: string | null;
  storage_path: string;
  enviado_por: string;
  created_at: string;
  profiles?: { nome: string } | null;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="h-4 w-4 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (mime === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function AnexosProjeto({ projetoId }: { projetoId: string }) {
  const { user, isCoordination } = useAuth();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    loadAnexos();
  }, [projetoId]);

  const loadAnexos = async () => {
    const { data } = await supabase
      .from("anexos_projeto")
      .select("*, profiles!anexos_projeto_enviado_por_fkey(nome)")
      .eq("projeto_id", projetoId)
      .order("created_at", { ascending: false }) as any;
    if (data) setAnexos(data);
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!user || files.length === 0) return;

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(`Arquivos acima de 20MB: ${oversized.map((f) => f.name).join(", ")}`);
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      const uid = crypto.randomUUID();
      const storagePath = `${projetoId}/${uid}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-attachments")
        .upload(storagePath, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { error: insertError } = await supabase.from("anexos_projeto").insert({
        projeto_id: projetoId,
        nome_arquivo: file.name,
        tamanho: file.size,
        tipo_mime: file.type || null,
        storage_path: storagePath,
        enviado_por: user.id,
      } as any);

      if (insertError) {
        toast.error(`Erro ao registrar ${file.name}`);
        continue;
      }
      successCount++;
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s)`);
      loadAnexos();
    }
    setUploading(false);
  }, [user, projetoId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    uploadFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  const handleDownload = (anexo: Anexo) => {
    const { data } = supabase.storage
      .from("project-attachments")
      .getPublicUrl(anexo.storage_path);
    window.open(data.publicUrl, "_blank");
  };

  const handleDelete = async (anexo: Anexo) => {
    const { error: storageError } = await supabase.storage
      .from("project-attachments")
      .remove([anexo.storage_path]);

    if (storageError) {
      toast.error("Erro ao remover arquivo do storage");
      return;
    }

    const { error } = await supabase
      .from("anexos_projeto")
      .delete()
      .eq("id", anexo.id);

    if (error) {
      toast.error("Erro ao remover registro");
      return;
    }

    toast.success("Anexo removido");
    loadAnexos();
  };

  const canDelete = (anexo: Anexo) => isCoordination || anexo.enviado_por === user?.id;

  return (
    <Card
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={isDragging ? "ring-2 ring-primary border-primary" : ""}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Paperclip className="h-5 w-5" /> Anexos e Documentos
        </CardTitle>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Adicionar Anexo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
            <Upload className="h-10 w-10 text-primary mb-2" />
            <p className="text-sm font-medium text-primary">Solte os arquivos aqui</p>
          </div>
        )}

        {anexos.length === 0 && !isDragging ? (
          <div
            className="flex flex-col items-center justify-center py-8 text-muted-foreground cursor-pointer border-2 border-dashed border-muted rounded-md hover:border-primary/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Arraste arquivos aqui ou clique para adicionar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead className="hidden sm:table-cell">Tamanho</TableHead>
                <TableHead className="hidden md:table-cell">Enviado por</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anexos.map((anexo) => (
                <TableRow key={anexo.id}>
                  <TableCell>
                    <button
                      onClick={() => handleDownload(anexo)}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors text-left"
                    >
                      <FileIcon mime={anexo.tipo_mime} />
                      <span className="truncate max-w-[200px]">{anexo.nome_arquivo}</span>
                    </button>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                    {formatFileSize(anexo.tamanho)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    {(anexo as any).profiles?.nome || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    {format(new Date(anexo.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {canDelete(anexo) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(anexo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
