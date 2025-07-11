"use client";

import { Target } from 'lucide-react';
import ModulePlaceholder from '@/components/module-placeholder';

export default function AnalisisVentasPage() {
    return (
        <ModulePlaceholder
            icon={Target}
            title="Análisis de Ventas"
            description="Mida el retorno de la inversión de sus actividades de trade marketing."
            onFileProcessed={(data) => console.log(data)}
            onDownloadTemplate={() => console.log("Descargar plantilla ROI")}
        />
    );
}
