"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Visit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataProcessed: (data: Visit[]) => void;
}

export default function FileUploader({ onDataProcessed }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: 'destructive',
        title: 'Archivo no válido',
        description: 'Por favor, seleccione un archivo Excel (.xlsx o .xls).',
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("El archivo Excel está vacío o no tiene datos.");
        }

        const requiredHeaders = ['agent', 'client', 'pdv_detail', 'city', 'date', 'activity', 'schedule', 'channel', 'budget'];
        const firstRow = json[0] || {};
        const headers = Object.keys(firstRow);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Faltan las columnas: ${missingHeaders.join(', ')}. Descargue la plantilla actualizada.`);
        }

        const parsedData: Visit[] = json.map((row, index) => {
          if (!row.agent || !row.client || !row.pdv_detail || !row.city || !row.date || !row.activity || !row.schedule || !row.channel || row.budget === undefined) {
            throw new Error(`Fila ${index + 2} incompleta. Todos los campos son obligatorios excepto las observaciones.`);
          }

          const visitDate = new Date(row.date);
          if (isNaN(visitDate.getTime())) {
            throw new Error(`Fecha inválida en la fila ${index + 2}: ${row.date}. Use el formato AAAA-MM-DD.`);
          }
          
          const budget = Number(row.budget);
          if (isNaN(budget)) {
            throw new Error(`Presupuesto inválido en la fila ${index + 2}: ${row.budget}. Debe ser un número.`);
          }

          return {
            id: `${file.name}-${Date.now()}-${index}`,
            agent: String(row.agent),
            client: String(row.client),
            pdv_detail: String(row.pdv_detail),
            city: String(row.city),
            date: visitDate,
            activity: row.activity as Visit['activity'],
            schedule: String(row.schedule),
            channel: String(row.channel),
            budget: budget,
            observations: String(row.observations || ''),
          };
        });

        onDataProcessed(parsedData);
        toast({
          title: 'Éxito',
          description: `Archivo "${file.name}" procesado con ${parsedData.length} registros.`,
        });
      } catch (error: any) {
        console.error('Error processing file:', error);
        toast({
          variant: 'destructive',
          title: 'Error al procesar el archivo',
          description: error.message || 'Asegúrese de que el formato del archivo sea correcto.',
        });
      } finally {
        setIsUploading(false);
        setFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({
            variant: "destructive",
            title: "Error de lectura",
            description: "No se pudo leer el archivo.",
        });
        setIsUploading(false);
        setFileName(null);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = [['agent', 'client', 'pdv_detail', 'city', 'date', 'activity', 'schedule', 'channel', 'budget', 'observations']];
    const exampleRow = [['Ana Gomez', 'Supermercado Exito', 'Exito Calle 80', 'Bogotá', '2024-07-20', 'Visita', 'AM', 'Moderno', 150000, 'Verificación de stock. (Valores para activity: Visita, Impulso, Verificación)']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleRow]);
    ws['!cols'] = [
        { wch: 20 }, // agent
        { wch: 25 }, // client
        { wch: 25 }, // pdv_detail
        { wch: 15 }, // city
        { wch: 15 }, // date
        { wch: 15 }, // activity
        { wch: 10 }, // schedule
        { wch: 15 }, // channel
        { wch: 15 }, // budget
        { wch: 50 }, // observations
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos de Visitas');
    XLSX.writeFile(wb, 'Visita360_Template.xlsx');
  };

  return (
    <Card className="text-center shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Cargar Archivo</CardTitle>
        <CardDescription>Añada un archivo Excel para consolidar los datos en el panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-primary/5"
            onClick={handleUploadClick}
            onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files) { const event = { target: { files: e.dataTransfer.files } } as any; handleFileChange(event); } }}
            onDragOver={(e) => e.preventDefault()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Procesando {fileName}...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-12 w-12 text-accent" />
              <p className="mb-1 text-muted-foreground">Arrastre y suelte o haga clic para cargar.</p>
              <Button size="sm">
                Seleccionar Archivo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
              />
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Soportamos archivos .xlsx y .xls.
        </p>
         <div className="mt-4 flex flex-col items-center justify-center gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
