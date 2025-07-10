"use client";

import { LineChart } from 'lucide-react';
import ModulePlaceholder from '@/components/module-placeholder';

export default function AnalisisVentasPage() {
    return (
        <ModulePlaceholder
            icon={LineChart}
            title="Análisis de Ventas"
            description="Suba sus archivos de ventas para generar reportes y visualizaciones."
            onFileProcessed={(data) => console.log(data)}
            onDownloadTemplate={() => console.log("Descargar plantilla Ventas")}
        />
    );
}
