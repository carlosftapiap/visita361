
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, Users2, PackageCheck, AlertTriangle, Loader2, RefreshCw, ClipboardList } from 'lucide-react';
import type { Visit } from '@/types';
import { getVisits } from '@/services/visitService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import KpiCard from '@/components/kpi-card';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import { materialsList } from '@/lib/materials';

export default function GrillaEjecucionMaterialesPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getVisits();
            setVisits(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al Cargar Datos",
                description: "No se pudieron obtener los datos. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { kpis, materialTotals } = useMemo(() => {
        const totalExpectedAttendance = visits.reduce((sum, visit) => sum + (visit['AFLUENCIA ESPERADA'] || 0), 0);
        const totalSamples = visits.reduce((sum, visit) => sum + (visit['CANTIDAD DE MUESTRAS'] || 0), 0);

        const totals: Record<string, number> = {};
        materialsList.forEach(m => totals[m] = 0);

        for (const visit of visits) {
            if (visit['MATERIAL POP']) {
                for (const [material, quantity] of Object.entries(visit['MATERIAL POP'])) {
                    if (totals[material] !== undefined) {
                        totals[material] += quantity;
                    }
                }
            }
        }

        return {
            kpis: {
                totalExpectedAttendance,
                totalSamples
            },
            materialTotals: totals,
        };
    }, [visits]);

    const renderContent = () => {
        if (loading) {
            return <DashboardSkeleton />;
        }
        if (error) {
            return (
                <Card className="shadow-md border-destructive bg-destructive/5 mt-6">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                            <AlertTriangle /> Error de Conexión
                        </CardTitle>
                        <CardDescription className="text-destructive/90">
                            No se pudieron cargar los datos de las visitas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                            {error}
                        </pre>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={fetchData} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Reintentar
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <KpiCard
                        title="Afluencia de Personas"
                        value={kpis.totalExpectedAttendance.toLocaleString('es-CO')}
                        icon={Users2}
                        description="Suma total de afluencia esperada en todas las actividades"
                    />
                    <KpiCard
                        title="Cantidad de Muestras"
                        value={kpis.totalSamples.toLocaleString('es-CO')}
                        icon={PackageCheck}
                        description="Suma total de muestras a entregar"
                    />
                </div>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-6 w-6 text-primary"/>
                                <CardTitle>Resumen de Materiales POP</CardTitle>
                            </div>
                        </div>
                        <CardDescription>Suma total de cada tipo de material utilizado en todas las actividades.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            {materialsList.map(material => (
                                <div key={material} className="flex justify-between border-b border-dashed py-1">
                                    <span className="text-muted-foreground">{material}</span>
                                    <span className="font-semibold text-primary">{materialTotals[material].toLocaleString('es-CO')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Planificación y Ejecución</CardTitle>
                        <CardDescription>
                            Esta sección contendrá la tabla o grilla de ejecución de materiales.
                        </CardDescription>
                    </CardHeader>
                     <CardContent className="flex flex-col items-center justify-center gap-6 text-center min-h-[40vh]">
                         <h3 className="text-xl font-semibold text-muted-foreground">Grilla en Construcción</h3>
                         <p className="max-w-md text-muted-foreground">
                            La visualización detallada de la ejecución de materiales estará disponible aquí próximamente.
                         </p>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">Grilla de Ejecución de Materiales</CardTitle>
                            <CardDescription>Visualice la planificación y ejecución de entrega de materiales.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            {renderContent()}
        </div>
    );
}
