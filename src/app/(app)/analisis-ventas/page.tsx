
"use client";

import { useState } from 'react';
import type { Sale } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Package, FileUp } from 'lucide-react';
import SalesFileUploader from '@/components/sales-file-uploader';
import SalesDashboard from '@/components/sales-dashboard';

export default function AnalisisVentasPage() {
    const [salesData, setSalesData] = useState<Sale[]>([]);

    const handleFileProcessed = (data: Sale[]) => {
        setSalesData(data);
    };

    const handleReset = () => {
        setSalesData([]);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <LineChart /> Análisis de Ventas
                    </h1>
                    <p className="text-muted-foreground">Cargue y visualice los datos de ventas para obtener información clave.</p>
                </div>
            </div>

            {salesData.length === 0 ? (
                 <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><FileUp/> Cargar Datos de Ventas</CardTitle>
                        <CardDescription>Para comenzar, suba un archivo Excel (.xlsx) con los datos de ventas. Puede descargar una plantilla para asegurarse de que el formato sea correcto.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SalesFileUploader onFileProcessed={handleFileProcessed} />
                    </CardContent>
                </Card>
            ) : (
                <SalesDashboard data={salesData} onReset={handleReset} />
            )}
        </div>
    );
}
