
"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Sale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

const requiredHeaders = [
    'ANIO',
    'MES',
    'REGION',
    'CIUDAD',
    'PROVINCIA',
    'ASESOR',
    'CLIENTE',
    'CANAL',
    'DATA',
    'FORMA',
    'MARCA',
    'CATEGORIA',
    'PRODUCTO',
    'PRODUCTO SISTEMA',
    'UNIDADES',
    'DOLARES',
    'COSTO_PROMEDIO'
];

interface SalesFileUploaderProps {
  onProcessing: () => void;
  onFileProcessed: (data: Sale[]) => void;
  onError: () => void;
  disabled?: boolean;
}

export default function SalesFileUploader({ onProcessing, onFileProcessed, onError, disabled = false }: SalesFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setIsUploading(false);
    setFileName(null);
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
  }
  
  const monthNameToNumber: { [key: string]: number } = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: 'destructive',
        title: 'Archivo no válido',
        description: 'Por favor, seleccione un archivo Excel (.xlsx o .xls).',
      });
      onError();
      return;
    }

    onProcessing();
    setIsUploading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          throw new Error("El archivo Excel está vacío o no tiene datos.");
        }

        const headers = Object.keys(json[0] || {});
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Faltan las columnas requeridas: ${missingHeaders.join(', ')}. Descargue la plantilla.`);
        }

        const parsedData = json.map((row, index) => {
            const getNumber = (value: any, fieldName: string) => {
                if (value === undefined || value === null || value === '') {
                     throw new Error(`El campo '${fieldName}' está vacío en la fila ${index + 2}.`);
                }
                const num = Number(String(value).replace(/[^0-9.-]+/g,""));
                if (isNaN(num)) {
                    throw new Error(`El campo '${fieldName}' no es un número válido en la fila ${index + 2}.`);
                }
                return num;
            };

            const year = getNumber(row['ANIO'], 'ANIO');
            const monthStr = String(row['MES'] || '').toLowerCase().trim();
            const month = monthNameToNumber[monthStr];

            if (!month) {
                throw new Error(`Mes inválido "${row['MES']}" en la fila ${index + 2}. Use el nombre completo, ej: "Enero".`);
            }
            const saleDate = new Date(year, month - 1, 15); // Use 15 to avoid timezone issues
            

            return {
                FECHA: saleDate.toISOString(),
                ANIO: year,
                MES: String(row['MES'] || ''),
                REGION: String(row['REGION'] || ''),
                CIUDAD: String(row['CIUDAD'] || ''),
                PROVINCIA: String(row['PROVINCIA'] || ''),
                ASESOR: String(row['ASESOR'] || ''),
                CLIENTE: String(row['CLIENTE'] || ''),
                CANAL: String(row['CANAL'] || ''),
                DATA: String(row['DATA'] || ''),
                FORMA: String(row['FORMA'] || ''),
                MARCA: String(row['MARCA'] || ''),
                CATEGORIA: String(row['CATEGORIA'] || ''),
                PRODUCTO: String(row['PRODUCTO'] || ''),
                'PRODUCTO SISTEMA': String(row['PRODUCTO SISTEMA'] || ''),
                UNIDADES: getNumber(row['UNIDADES'], 'UNIDADES'),
                DOLARES: getNumber(row['DOLARES'], 'DOLARES'),
                COSTO_PROMEDIO: getNumber(row['COSTO_PROMEDIO'], 'COSTO_PROMEDIO'),
            } as Sale;
        });

        onFileProcessed(parsedData);
        
        toast({
          title: 'Éxito de procesamiento',
          description: `Archivo "${file.name}" procesado con ${parsedData.length} registros de ventas.`,
        });

      } catch (error: any) {
        console.error('Error processing file:', error);
        toast({
          variant: 'destructive',
          title: 'Error al procesar el archivo',
          description: error.message || 'Asegúrese de que el formato del archivo sea correcto.',
        });
        onError();
      } finally {
        resetState();
      }
    };
    
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({
            variant: "destructive",
            title: "Error de lectura",
            description: "No se pudo leer el archivo.",
        });
        onError();
        resetState();
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const exampleRow = [
       [2024, 'Julio', 'Andina', 'Bogotá', 'Cundinamarca', 'Asesor 1', 'Cliente A', 'Retail', 'Dato 1', 'Forma 1', 'Marca X', 'Categoría Y', 'Producto Z', 'SKU-123', 10, 500.50, 50.05]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([requiredHeaders, ...exampleRow]);
    ws['!cols'] = requiredHeaders.map(header => ({ wch: header.length + 5 })); // Adjust column width
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos de Ventas');
    XLSX.writeFile(wb, 'Ventas_Template.xlsx');
  };

 const renderContent = () => {
    if (isUploading) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Procesando {fileName}...</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-12 w-12 text-accent" />
            <p className="mb-1 text-muted-foreground">Arrastre y suelte o haga clic para cargar.</p>
            <Button size="sm" disabled={isUploading || disabled}>
                Seleccionar Archivo
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
                disabled={isUploading || disabled}
            />
        </div>
    )
  }

  return (
    <div className="text-center">
      <div
          className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors",
              !(isUploading || disabled) && "cursor-pointer hover:border-primary hover:bg-primary/5",
              (isUploading || disabled) && "cursor-not-allowed bg-muted/50"
          )}
          onClick={handleUploadClick}
          onDrop={(e) => { 
              e.preventDefault(); 
              if (isUploading || disabled) return;
              if(e.dataTransfer.files) { 
                  const event = { target: { files: e.dataTransfer.files } } as any; 
                  handleFileChange(event); 
              } 
          }}
          onDragOver={(e) => e.preventDefault()}
      >
        {renderContent()}
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
    </div>
  );
}
