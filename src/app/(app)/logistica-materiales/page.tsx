
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, DollarSign, List, Truck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getVisits } from '@/services/visitService';
import type { VisitWithMaterials } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import KpiCard from '@/components/kpi-card';
import DashboardSkeleton from '@/components/dashboard-skeleton';

const formatMaterialPopForTable = (materials?: { name: string; quantity: number }[]): string => {
    if (!materials || materials.length === 0) {
        return 'N/A';
    }
    return materials.map(m => `${m.name} (${m.quantity})`).join(', ');
};

export default function LogisticaMaterialesPage() {
    const [visits, setVisits] = useState<VisitWithMaterials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getVisits();
            const impulseVisitsWithMaterials = data.filter(
                (visit): visit is VisitWithMaterials =>
                    visit.ACTIVIDAD === 'IMPULSACIÓN' &&
                    Array.isArray(visit.visit_materials) &&
                    visit.visit_materials.length > 0
            );
            setVisits(impulseVisitsWithMaterials);
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

    const kpis = useMemo(() => {
        const totalActivities = visits.length;
        const totalCost = visits.reduce((sum, visit) => sum + (visit.total_cost || 0), 0);
        const totalItems = visits.reduce((sum, visit) => {
            return sum + (visit.visit_materials?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
        }, 0);

        return { totalActivities, totalCost, totalItems };
    }, [visits]);

    const renderContent = () => {
        if (loading) {
            return <DashboardSkeleton />;
        }

        if (error) {
            return (
                <Card className="shadow-md border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                            <AlertTriangle /> Error de Carga
                        </CardTitle>
                        <CardDescription className="text-destructive/90">
                           No se pudieron cargar los datos de logística. Revisa el mensaje de error.
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
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard
                        title="Actividades de Impulso"
                        value={kpis.totalActivities}
                        icon={Package}
                        description="Total de actividades de impulso con material."
                    />
                    <KpiCard
                        title="Costo Total de Materiales"
                        value={kpis.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                        icon={DollarSign}
                        description="Suma del costo de todos los materiales."
                    />
                    <KpiCard
                        title="Total de Artículos"
                        value={kpis.totalItems}
                        icon={List}
                        description="Suma de todas las cantidades de material."
                    />
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Detalle de Requerimientos por Actividad</CardTitle>
                        <CardDescription>
                            Listado de todas las actividades de impulso que requieren materiales, con su costo asociado.
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
                                    {visits.length > 0 ? (
                                        visits.map(visit => (
                                            <TableRow key={visit.id}>
                                                <TableCell>{format(new Date(visit.FECHA), 'P')}</TableCell>
                                                <TableCell>{visit['EJECUTIVA DE TRADE']}</TableCell>
                                                <TableCell>{visit.ACTIVIDAD}</TableCell>
                                                <TableCell>{`${visit.CADENA} / ${visit['DIRECCIÓN DEL PDV']}`}</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {formatMaterialPopForTable(visit.visit_materials?.map(vm => ({ name: vm.materials.name, quantity: vm.quantity })))}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {(visit.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No se encontraron actividades de impulso que requieran materiales.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </>
        );
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Truck /> Logística de Materiales
                    </h1>
                    <p className="text-muted-foreground">Planifique y visualice los costos de material para actividades de impulso.</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}
