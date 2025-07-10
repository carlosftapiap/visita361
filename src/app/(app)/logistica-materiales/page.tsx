"use client";

import { Wrench } from 'lucide-react';
import ModulePlaceholder from '@/components/module-placeholder';
import * as XLSX from 'xlsx';

export default function LogisticaMaterialesPage() {

    const handleDownloadTemplate = () => {
        const headers = [
            "Fecha",
            "Ejecutiva de Trade",
            "Asesor Comercial",
            "Cadena",
            "Materiales Requeridos (Cantidad x Nombre)",
            "Costo Total Material"
        ];
        const exampleRow = [
            "2024-08-15",
            "Luisa Perez",
            "Carlos Mejia",
            "Exito",
            "10 x AFICHE, 2 x CARPA",
            "1520.00"
        ];
        
        const ws = XLSX.utils.aoa_to_sheet([headers, [exampleRow]]);
        ws['!cols'] = headers.map(() => ({ wch: 30 })); 
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Logistica');
        XLSX.writeFile(wb, 'Logistica_Template.xlsx');
    };

    const handleFileProcessed = (data: any[]) => {
        // Lógica para procesar el archivo de logística
        console.log("Datos de logística procesados:", data);
        // Aquí iría la lógica para actualizar el estado o llamar al servicio
    };

    return (
        <ModulePlaceholder
            icon={Wrench}
            title="Logística de Materiales"
            description="Suba el archivo de logística para planificar y visualizar los costos de material para actividades de impulso."
            onFileProcessed={handleFileProcessed}
            onDownloadTemplate={handleDownloadTemplate}
        />
    );
}
