"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Visit } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onDataProcessed: (data: Visit[]) => void;
  mockData: Visit[];
}

export default function FileUploader({ onDataProcessed, mockData }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation for file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
            variant: "destructive",
            title: "Archivo no válido",
            description: "Por favor, seleccione un archivo Excel (.xlsx o .xls).",
        });
        return;
      }

      setIsUploading(true);
      // Simulate file processing
      // In a real app, you would use a library like 'xlsx' to parse the file
      // and then call onDataProcessed with the result.
      setTimeout(() => {
        onDataProcessed(mockData);
        setIsUploading(false);
        toast({
            title: "Éxito",
            description: "Su archivo ha sido procesado correctamente.",
        })
      }, 2000); // Simulating a 2-second processing time
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="text-center shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Analice sus Datos de Visitas</CardTitle>
        <CardDescription>Cargue su archivo Excel para comenzar a visualizar las métricas de su equipo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary hover:bg-primary/5"
            onClick={handleUploadClick}
            onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files) { const event = { target: { files: e.dataTransfer.files } } as any; handleFileChange(event); } }}
            onDragOver={(e) => e.preventDefault()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Procesando archivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <UploadCloud className="h-12 w-12 text-accent" />
              <p className="mb-2 text-muted-foreground">Arrastre y suelte su archivo aquí, o haga clic para seleccionar.</p>
              <Button>
                Seleccionar Archivo Excel
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
          Soportamos archivos .xlsx y .xls. La app leerá todas las hojas de su documento.
        </p>
      </CardContent>
    </Card>
  );
}
