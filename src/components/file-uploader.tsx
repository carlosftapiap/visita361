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

const spanishHeaders = [
    'EJECUTIVA DE TRADE',
    'ASESOR COMERCIAL', 
    'CANAL', 
    'CADENA', 
    'DETALLE DEL PDV', 
    'ACTIVIDAD', 
    'HORARIO', 
    'CIUDAD', 
    'ZONA', 
    'FECHA',
    'PRESUPUESTO'
];

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
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          throw new Error("El archivo Excel está vacío o no tiene datos.");
        }

        const firstRow = json[0] || {};
        const headers = Object.keys(firstRow);
        const missingHeaders = spanishHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Faltan las columnas: ${missingHeaders.join(', ')}. Descargue la plantilla actualizada.`);
        }

        const initialData = json.map((row, index) => {
            const visitDate = new Date(row['FECHA']);
            
            const budgetValue = row['PRESUPUESTO'];
            let budget = Number(budgetValue);
            if (isNaN(budget)) {
                budget = 0; // If budget is not a valid number, treat as 0
            }

            const getString = (value: any) => value === undefined || value === null ? '' : String(value);

            return {
                id: `${file.name}-${Date.now()}-${index}`,
                trade_executive: getString(row['EJECUTIVA DE TRADE']),
                agent: getString(row['ASESOR COMERCIAL']),
                channel: getString(row['CANAL']),
                chain: getString(row['CADENA']),
                pdv_detail: getString(row['DETALLE DEL PDV']),
                activity: getString(row['ACTIVIDAD']) as Visit['activity'],
                schedule: getString(row['HORARIO']),
                city: getString(row['CIUDAD']),
                zone: getString(row['ZONA']),
                date: visitDate,
                budget: budget,
            };
        });

        const parsedData = initialData.filter(visit => {
            // Date is essential, filter out rows where it's missing or invalid
            return visit.date && !isNaN(visit.date.getTime());
        });

        const skippedRowCount = json.length - parsedData.length;
        
        onDataProcessed(parsedData);
        
        let description = `Archivo "${file.name}" procesado con ${parsedData.length} registros.`;
        if (skippedRowCount > 0) {
            description += ` Se omitieron ${skippedRowCount} filas por tener una fecha inválida o ausente.`;
        }

        toast({
          title: 'Éxito',
          description: description,
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
    const headers = [spanishHeaders];
    const exampleRow = [['Luisa Perez', 'Ana Gomez', 'Moderno', 'Exito', 'Exito Calle 80', 'Visita', 'AM', 'Bogotá', 'Norte', '2024-07-20', 500000]];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleRow]);
    ws['!cols'] = [
        { wch: 25 }, // EJECUTIVA DE TRADE
        { wch: 20 }, // ASESOR COMERCIAL
        { wch: 15 }, // CANAL
        { wch: 20 }, // CADENA
        { wch: 25 }, // DETALLE DEL PDV
        { wch: 15 }, // ACTIVIDAD
        { wch: 10 }, // HORARIO
        { wch: 15 }, // CIUDAD
        { wch: 15 }, // ZONA
        { wch: 15 }, // FECHA
        { wch: 15 }, // PRESUPUESTO
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
