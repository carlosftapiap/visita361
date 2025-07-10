
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, Users2, PackageCheck, AlertTriangle, Loader2, RefreshCw, Package } from 'lucide-react';
import type { Visit, Material } from '@/types';
import { getVisits, getMaterials } from '@/services/visitService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import KpiCard from '@/components/kpi-card';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import { format } from 'date-fns';

const formatMaterialPopForTable = (materials?: Record<string, number>): string => {
    if (!materials || Object.keys(materials).length === 0) {
        return 'N/A';
    }
    return Object.entries(materials)
        .map(([key, value]) => `${key} (${value})`)
        .join(', ');
};

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

    const { kpis, impulsacionVisits } = useMemo(() => {
        if (!visits || visits.length === 0) {
            return {
                kpis: {
                    totalExpectedAttendance: 0,
                    totalSamples: 0,
                    materialTotals: []
                },
                impulsacionVisits: []
            };
        }
        const totalExpectedAttendance = visits.reduce((sum, visit) => sum + (visit['AFLUENCIA ESPERADA'] || 0), 0);
        const totalSamples = visits.reduce((sum, visit) => sum + (visit['CANTIDAD DE MUESTRAS'] || 0), 0);
        
        const materialTotals = materials.reduce((acc, material) => {
            acc[material.name] = 0;
            return acc;
        }, {} as Record<string, number>);

        for (const visit of visits) {
            if (visit['MATERIAL POP']) {
                for (const [materialName, quantity] of Object.entries(visit['MATERIAL POP'])) {
                    if (materialTotals.hasOwnProperty(materialName)) {
                        materialTotals[materialName] += quantity || 0;
                    }
                }
            }
        }
        
        const impulsacionVisits = visits.filter(v => v['ACTIVIDAD'] === 'IMPULSACIÓN');

        return {
            kpis: {
                totalExpectedAttendance,
                totalSamples,
                materialTotals: Object.entries(materialTotals).sort(([aName], [bName]) => aName.localeCompare(bName))
            },
            impulsacionVisits
        };
    }, [visits, materials]);

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
                 <Card className="shadow-lg mt-6">
                    <CardHeader>
                        <CardTitle>Planificación y Ejecución de Impulsaciones</CardTitle>
                        <CardDescription>
                            Detalle de todas las actividades de impulsación y sus requerimientos.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                         <div className="relative max-h-[60vh] overflow-auto rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Ejecutiva de Trade</TableHead>
                                        <TableHead>Actividad</TableHead>
                                        <TableHead>Cadena / PDV</TableHead>
                                        <TableHead>Materiales Requeridos</TableHead>
                                        <TableHead className="text-right">Costo Total de Material</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {impulsacionVisits.length > 0 ? (
                                        impulsacionVisits.map(visit => (
                                            <TableRow key={visit.id}>
                                                <TableCell>{format(new Date(visit['FECHA']), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{visit['EJECUTIVA DE TRADE']}</TableCell>
                                                <TableCell><span className="rounded-full bg-accent/20 text-accent-foreground px-2 py-1 text-xs">{visit['ACTIVIDAD']}</span></TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{visit['CADENA']}</div>
                                                    <div className="text-xs text-muted-foreground">{visit['DIRECCIÓN DEL PDV']}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{formatMaterialPopForTable(visit['MATERIAL POP'])}</TableCell>
                                                <TableCell className="text-right font-mono">{visit.total_cost?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) || '$0'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No hay actividades de "IMPULSACIÓN" para mostrar.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </div>
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
