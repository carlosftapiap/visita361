"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ModulePlaceholderProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onFileProcessed: (data: any[]) => void;
    onDownloadTemplate: () => void;
}

export default function ModulePlaceholder({ title, description, icon: Icon, onFileProcessed, onDownloadTemplate }: ModulePlaceholderProps) {
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

                onFileProcessed(json);
                toast({
                    title: 'Éxito',
                    description: `Archivo "${file.name}" procesado con ${json.length} registros.`,
                });

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error al procesar',
                    description: error.message || 'No se pudo procesar el archivo Excel.',
                });
            } finally {
                setIsUploading(false);
                setFileName(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        reader.onerror = () => {
             toast({
                variant: 'destructive',
                title: 'Error de Lectura',
                description: 'No se pudo leer el archivo.',
            });
            setIsUploading(false);
        };
        
        reader.readAsArrayBuffer(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 md:p-6">
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 text-center min-h-[60vh]">
                     <div
                        className={cn(
                            "flex w-full max-w-lg flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors",
                            !isUploading && "cursor-pointer hover:border-primary hover:bg-primary/5"
                        )}
                        onClick={!isUploading ? handleUploadClick : undefined}
                        onDrop={(e) => { 
                          e.preventDefault(); 
                          if (isUploading) return;
                          if(e.dataTransfer.files) { 
                              const event = { target: { files: e.dataTransfer.files } } as any; 
                              handleFileChange(event); 
                          } 
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {isUploading ? (
                             <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-muted-foreground">Procesando {fileName}...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UploadCloud className="h-12 w-12 text-accent" />
                                <p className="mb-1">Arrastre y suelte o haga clic para cargar.</p>
                                <Button size="sm" onClick={handleUploadClick}>
                                    Seleccionar Archivo
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    disabled={isUploading}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Button variant="outline" onClick={onDownloadTemplate} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Plantilla
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
