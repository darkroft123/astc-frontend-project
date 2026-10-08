import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Loader2, AlertCircle, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HolidayImporterProps {
  onImport: (items: { date: string; name: string }[], namePrefix: string) => Promise<void>;
  year: number;
}

export function HolidayImporter({ onImport, year }: HolidayImporterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textData, setTextData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseLines = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const parsedItems: { date: string; name: string }[] = [];
    
    // Admite separadores como coma, punto y coma, guión, dos puntos o espacios
    const regex = /^["']?(\d{4}-\d{2}-\d{2})["']?[\s,\-;:|]+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Ignorar cabeceras comunes de CSV
      if (i === 0 && (line.toLowerCase().includes("date") || line.toLowerCase().includes("fecha"))) {
        continue;
      }

      const match = line.match(regex);
      if (!match) {
        throw new Error(`Línea ${i + 1} no tiene un formato válido. Formato esperado: YYYY-MM-DD, Nombre`);
      }

      const dateStr = match[1];
      // Limpiar comillas si vienen del CSV y guiones sueltos
      let nameStr = match[2].trim().replace(/^["']|["']$/g, '');
      if (nameStr.startsWith('-') || nameStr.startsWith(',')) {
        nameStr = nameStr.substring(1).trim();
      }
      
      // Validar que sea una fecha real
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Línea ${i + 1}: Fecha inválida '${dateStr}'.`);
      }

      parsedItems.push({ date: dateStr, name: nameStr });
    }

    if (parsedItems.length === 0) {
      throw new Error("No se encontraron feriados válidos.");
    }

    return parsedItems;
  };

  const handleImportText = async () => {
    setError(null);
    if (!textData.trim()) {
      setError("Por favor, ingrese los feriados en el área de texto.");
      return;
    }

    try {
      const parsedItems = parseLines(textData);
      setLoading(true);
      await onImport(parsedItems, `Feriados Importados ${year}`);
      setOpen(false);
      setTextData("");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al importar los feriados.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedItems = parseLines(text);
      setLoading(true);
      await onImport(parsedItems, `Feriados Importados CSV ${year}`);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al leer el archivo CSV.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resetState = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setError(null);
      setTextData("");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => resetState(true)} className="text-zinc-600 bg-white">
        <Upload className="w-4 h-4 mr-2 text-violet-600" /> Importar Feriados
      </Button>

      <Dialog open={open} onOpenChange={resetState}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Importar Feriados</DialogTitle>
            <DialogDescription>
              Carga tus feriados masivamente desde un archivo CSV o pegando texto.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* INSTRUCCIONES DE FORMATO REQUERIDAS */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Formato Requerido
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Usa un feriado por línea.</li>
                <li>El formato estricto debe ser: <strong>AAAA-MM-DD, Nombre del feriado</strong></li>
                <li>Se aceptan separadores como comas (<code>,</code>), guiones (<code>-</code>) o espacios.</li>
              </ul>
              <div className="font-mono text-xs bg-card p-2 rounded border border-blue-200 mt-2">
                Ejemplos válidos:<br/>
                2026-12-25, Navidad<br/>
                2026-01-01 - Año Nuevo<br/>
                2026-07-28 Fiestas Patrias
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Pegar Texto</TabsTrigger>
                <TabsTrigger value="csv">Subir Archivo CSV</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4 space-y-4">
                <Textarea 
                  placeholder={`2026-12-25, Navidad\n2026-01-01 - Año Nuevo`}
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                />
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => resetState(false)}>Cancelar</Button>
                  <Button onClick={handleImportText} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Importar Texto
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="csv" className="mt-4 space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/50 hover:bg-zinc-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <FileText className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-muted-foreground">Haz clic para subir archivo CSV</p>
                    <p className="text-xs text-zinc-500 mt-1">El archivo debe seguir el formato requerido (.csv o .txt)</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv,.txt"
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mt-4">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => resetState(false)}>Cancelar</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
