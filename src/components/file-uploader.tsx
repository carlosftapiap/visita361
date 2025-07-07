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
  mockData: Visit[];
}

export default function FileUploader({ onDataProcessed, mockData }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
            variant: "destructive",
            title: "Archivo no válido",
            description: "Por favor, seleccione un archivo Excel (.xlsx o .xls).",
        });
        return;
      }

      setIsUploading(true);
      setFileName(file.name);
      // In a real app, you would parse the file. Here we simulate it.
      // The unique ID generation is crucial for data consolidation.
      setTimeout(() => {
        const processedWithUniqueIds = mockData.map((visit, index) => ({
          ...visit,
          id: `${file.name}-${Date.now()}-${index}`,
        }));
        onDataProcessed(processedWithUniqueIds);
        setIsUploading(false);
        setFileName(null);
        toast({
            title: "Éxito",
            description: `Archivo "${file.name}" procesado y añadido al panel.`,
        });
      }, 2000); // Simulating a 2-second processing time
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = [['agent', 'client', 'city', 'date', 'activity', 'observations']];
    const exampleRow = [['Ana Gomez', 'Supermercado Exito', 'Bogotá', '2024-07-20', 'Visita', 'Verificación de stock. (Valores para activity: Visita, Impulso, Verificación)']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleRow]);
    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, // agent
        { wch: 25 }, // client
        { wch: 15 }, // city
        { wch: 15 }, // date
        { wch: 15 }, // activity
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
