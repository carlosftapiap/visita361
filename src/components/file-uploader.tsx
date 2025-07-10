
"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Visit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { materialsList } from '@/lib/materials';

const spanishHeaders = [
    'EJECUTIVA DE TRADE',
    'ASESOR COMERCIAL',
    'CANAL',
    'CADENA',
    'DIRECCIÓN DEL PDV',
    'ACTIVIDAD',
    'HORARIO',
    'CIUDAD',
    'ZONA',
    'FECHA',
    'PRESUPUESTO',
    'AFLUENCIA ESPERADA',
    'FECHA DE ENTREGA DE MATERIAL',
    'OBJETIVO DE LA ACTIVIDAD',
    'CANTIDAD DE MUESTRAS',
    'OBSERVACION',
    ...materialsList.map(m => `CANTIDAD ${m}`)
];

export default function FileUploader({ onFileProcessed, disabled = false, loadedMonths = [] }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  interface FileUploaderProps {
    onFileProcessed: (data: Omit<Visit, 'id'>[]) => void;
    disabled?: boolean;
    loadedMonths?: string[];
  }

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
        const requiredHeaders = [
            'EJECUTIVA DE TRADE', 'ASESOR COMERCIAL', 'CANAL', 'CADENA', 'DIRECCIÓN DEL PDV',
            'ACTIVIDAD', 'HORARIO', 'CIUDAD', 'ZONA', 'FECHA'
        ];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Faltan las columnas requeridas: ${missingHeaders.join(', ')}. Descargue la plantilla actualizada.`);
        }

        const initialData = json.map((row) => {
            const visitDate = row['FECHA'] ? new Date(row['FECHA']) : new Date();
            const deliveryDate = row['FECHA DE ENTREGA DE MATERIAL'] ? new Date(row['FECHA DE ENTREGA DE MATERIAL']) : undefined;

            const getNumber = (value: any) => {
                if (value === undefined || value === null || value === '') return undefined;
                const num = Number(value);
                return isNaN(num) ? undefined : num;
            };
            
            const getString = (value: any) => value === undefined || value === null ? '' : String(value);

            const getMaterialPopObject = (row: any) => {
                const materials: Record<string, number> = {};
                materialsList.forEach(material => {
                    const colName = `CANTIDAD ${material}`;
                    const quantity = getNumber(row[colName]);
                    if (quantity !== undefined && quantity > 0) {
                        materials[material] = quantity;
                    }
                });
                return materials;
            }

            return {
                'EJECUTIVA DE TRADE': getString(row['EJECUTIVA DE TRADE']),
                'ASESOR COMERCIAL': getString(row['ASESOR COMERCIAL']),
                'CANAL': getString(row['CANAL']),
                'CADENA': getString(row['CADENA']),
                'DIRECCIÓN DEL PDV': getString(row['DIRECCIÓN DEL PDV']),
                'ACTIVIDAD': getString(row['ACTIVIDAD']) as Visit['ACTIVIDAD'],
                'HORARIO': getString(row['HORARIO']),
                'CIUDAD': getString(row['CIUDAD']),
                'ZONA': getString(row['ZONA']),
                'FECHA': visitDate,
                'PRESUPUESTO': getNumber(row['PRESUPUESTO']) || 0,
                'AFLUENCIA ESPERADA': getNumber(row['AFLUENCIA ESPERADA']),
                'FECHA DE ENTREGA DE MATERIAL': deliveryDate,
                'OBJETIVO DE LA ACTIVIDAD': getString(row['OBJETIVO DE LA ACTIVIDAD']),
                'CANTIDAD DE MUESTRAS': getNumber(row['CANTIDAD DE MUESTRAS']),
                'MATERIAL POP': getMaterialPopObject(row),
                'OBSERVACION': getString(row['OBSERVACION']),
            };
        });

        const parsedData = initialData.filter(visit => {
            if (!visit['FECHA'] || isNaN(visit['FECHA'].getTime())) {
                return false;
            }
            const year = visit['FECHA'].getFullYear();
            return year >= 1970 && year <= 2100;
        });

        const skippedRowCount = json.length - parsedData.length;

        if (parsedData.length === 0 && json.length > 0) {
          throw new Error("Ningún registro válido encontrado. Verifique que la columna 'FECHA' contenga fechas correctas.");
        }
        
        onFileProcessed(parsedData as Omit<Visit, 'id'>[]);
        
        let description = `Archivo "${file.name}" procesado con ${parsedData.length} registros.`;
        if (skippedRowCount > 0) {
            description += ` Se omitieron ${skippedRowCount} filas por tener una fecha inválida, fuera de rango o ausente.`;
        }

        toast({
          title: 'Éxito de procesamiento',
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
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const exampleRow: any[] = [['Luisa Perez', 'Ana Gomez', 'Moderno', 'Exito', 'Exito Calle 80', 'Visita', 'AM', 'Bogotá', 'Norte', '2024-07-20', 1000000, 50, '2024-07-19', 'Aumentar visibilidad', 100, 'Sin novedades']];
    const materialQuantities = [10, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Example quantities
    exampleRow[0].push(...materialQuantities);

    const ws = XLSX.utils.aoa_to_sheet([spanishHeaders, ...exampleRow]);
    ws['!cols'] = spanishHeaders.map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos de Visitas');
    XLSX.writeFile(wb, 'Visita360_Template.xlsx');
  };

  return (
    <div className="text-center">
      {loadedMonths && loadedMonths.length > 0 && (
          <div className="mb-4 rounded-md border bg-muted/50 p-3 text-left text-sm">
              <div className="flex items-center gap-2 font-semibold text-card-foreground">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <p>Meses con datos ya cargados:</p>
              </div>
              <p className="mt-1 text-muted-foreground pl-7">
                  {loadedMonths.join(', ')}
              </p>
          </div>
      )}
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
        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Procesando {fileName}...</p>
          </div>
        ) : (
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
    </div>
  );
}
