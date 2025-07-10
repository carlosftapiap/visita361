
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, Users2, PackageCheck, AlertTriangle, Loader2, RefreshCw, Package, DollarSign } from 'lucide-react';
import type { Visit, Material } from '@/types';
import { getVisits, getMaterials } from '@/services/visitService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import KpiCard from '@/components/kpi-card';
import DashboardSkeleton from '@/components/dashboard-skeleton';

export default function GrillaEjecucionMaterialesPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [visitsData, materialsData] = await Promise.all([getVisits(), getMaterials()]);
            setVisits(visitsData);
            setMaterials(materialsData);
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

    const { kpis } = useMemo(() => {
        if (!visits || visits.length === 0) {
            return {
                kpis: {
                    totalExpectedAttendance: 0,
                    totalSamples: 0,
                    materialTotals: [],
                    totalMaterialCost: 0
                }
            };
        }
        const totalExpectedAttendance = visits.reduce((sum, visit) => sum + (visit['AFLUENCIA ESPERADA'] || 0), 0);
        const totalSamples = visits.reduce((sum, visit) => sum + (visit['CANTIDAD DE MUESTRAS'] || 0), 0);
        const totalMaterialCost = visits.reduce((sum, visit) => sum + (visit.total_cost || 0), 0);
        
        const materialTotalsMap: Record<string, number> = {};
        materials.forEach(material => {
            materialTotalsMap[material.name] = 0;
        });

        visits.forEach(visit => {
            if (visit['MATERIAL POP']) {
                for (const [materialName, quantity] of Object.entries(visit['MATERIAL POP'])) {
                    if (materialTotalsMap.hasOwnProperty(materialName)) {
                        materialTotalsMap[materialName] += quantity || 0;
                    }
                }
            }
        });
        
        const materialTotals = Object.entries(materialTotalsMap).sort(([aName], [bName]) => aName.localeCompare(bName));
        
        return {
            kpis: {
                totalExpectedAttendance,
                totalSamples,
                materialTotals,
                totalMaterialCost
            }
        };
    }, [visits, materials]);

    if (loading) {
        return <div className="p-4 md:p-6"><DashboardSkeleton /></div>;
    }

    if (error) {
        return (
            <div className="p-4 md:p-6">
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
            </div>
        );
    }
    
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <KpiCard
                    title="Costo Total de Materiales"
                    value={kpis.totalMaterialCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    icon={DollarSign}
                    description="Suma total del costo de los materiales"
                />
            </div>
            
            <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="text-primary"/> Resumen de Materiales POP</CardTitle>
                    <CardDescription>Suma total de cada tipo de material utilizado en todas las actividades.</CardDescription>
                </CardHeader>
                <CardContent>
                    {kpis.materialTotals.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {kpis.materialTotals.map(([name, total]) => (
                                <div key={name} className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 border">
                                    <p className="text-sm font-medium text-muted-foreground text-center">{name}</p>
                                    <p className="font-bold text-2xl text-primary">{total.toLocaleString('es-CO')}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No hay datos de materiales para mostrar.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
