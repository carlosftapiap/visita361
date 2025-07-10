
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wrench, AlertTriangle, Package, DollarSign, ListOrdered, Loader2, RefreshCw } from 'lucide-react';
import { getVisitsWithMaterials } from '@/services/visitService';
import type { VisitWithMaterials } from '@/types';
import KpiCard from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import { Button } from '@/components/ui/button';

export default function LogisticaMaterialesPage() {
    const [data, setData] = useState<VisitWithMaterials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const visitsWithMaterials = await getVisitsWithMaterials();
            setData(visitsWithMaterials);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al Cargar Datos de Logística",
                description: "No se pudieron obtener los datos. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const kpis = useMemo(() => {
        const totalActivities = data.length;
        const totalCost = data.reduce((sum, visit) => sum + (visit.total_cost || 0), 0);
        const totalItems = data.reduce((sum, visit) => {
            return sum + visit.visit_materials.reduce((itemSum, mat) => itemSum + mat.quantity, 0);
        }, 0);

        return { totalActivities, totalCost, totalItems };
    }, [data]);

    const formatMaterialsList = (materials: VisitWithMaterials['visit_materials']) => {
        if (!materials || materials.length === 0) return 'N/A';
        return materials.map(m => `${m.quantity} x ${m.materials.name}`).join(', ');
    };
    
    const renderContent = () => {
        if (loading) {
            return <DashboardSkeleton />;
        }
        if (error) {
             return (
                <Card className="shadow-md border-destructive bg-destructive/5">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                        <AlertTriangle /> Error de Conexión o Configuración
                    </CardTitle>
                    <CardDescription className="text-destructive/90">
                        No se pudo completar la operación debido a un problema. Revisa el siguiente mensaje para solucionarlo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2 text-card-foreground">Mensaje de Error Detallado:</h3>
                    <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                        {error}
                    </pre>
                </CardContent>
                <CardFooter>
                    <Button onClick={fetchData} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reintentar Conexión
                    </Button>
                </CardFooter>
                </Card>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <KpiCard title="Actividades con Material" value={kpis.totalActivities} icon={Package} description="Total de actividades que requieren material." />
                    <KpiCard title="Costo Total de Materiales" value={kpis.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} icon={DollarSign} description="Suma del costo de todos los materiales." />
                    <KpiCard title="Total de Artículos" value={kpis.totalItems.toLocaleString('es-CO')} icon={ListOrdered} description="Suma de todas las cantidades de material." />
                </div>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Detalle de Requerimientos por Actividad</CardTitle>
                        <CardDescription>
                            Listado de todas las actividades que requieren materiales, con su costo asociado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative max-h-[65vh] overflow-auto rounded-md border">
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
                                    {data.length > 0 ? (
                                        data.map(visit => (
                                            <TableRow key={visit.id}>
                                                <TableCell>{new Date(visit.FECHA).toLocaleDateString('es-CO')}</TableCell>
                                                <TableCell className="font-medium">{visit['EJECUTIVA DE TRADE']}</TableCell>
                                                <TableCell>{visit['ACTIVIDAD']}</TableCell>
                                                <TableCell>{visit['CADENA']} - {visit['DIRECCIÓN DEL PDV']}</TableCell>
                                                <TableCell>{formatMaterialsList(visit.visit_materials)}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {(visit.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No se encontraron actividades que requieran materiales.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Wrench /> Logística de Materiales
                    </h1>
                    <p className="text-muted-foreground">Planifique y visualice los costos de material para todas las actividades.</p>
                </div>
            </div>
            
            {renderContent()}
        </div>
    );
}
