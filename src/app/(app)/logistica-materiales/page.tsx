
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wrench, AlertTriangle, RefreshCw, Loader2, DollarSign, Activity, Package } from 'lucide-react';
import type { VisitWithMaterials } from '@/types';
import { getImpulseVisitsWithMaterials } from '@/services/visitService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import KpiCard from '@/components/kpi-card';


export default function LogisticaMaterialesPage() {
    const [visits, setVisits] = useState<VisitWithMaterials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchImpulseVisits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getImpulseVisitsWithMaterials();
            setVisits(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al cargar datos",
                description: "No se pudieron obtener los datos de impulso. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchImpulseVisits();
    }, [fetchImpulseVisits]);

    const kpis = useMemo(() => {
        const totalActivities = visits.length;
        let totalMaterialCost = 0;
        let totalItems = 0;

        visits.forEach(visit => {
            totalMaterialCost += visit.total_cost || 0;
            if (visit.visit_materials) {
                 visit.visit_materials.forEach(item => {
                    totalItems += item.quantity;
                });
            }
        });

        return { totalActivities, totalMaterialCost, totalItems };
    }, [visits]);

    const formatMaterialDetails = (materials: VisitWithMaterials['visit_materials']) => {
        if (!materials || materials.length === 0) return 'N/A';
        return (
            <div className="flex flex-wrap gap-2">
                {materials.map(item => (
                    <Badge key={item.materials.id} variant="secondary" className="font-normal">
                       {item.quantity} x {item.materials.name}
                    </Badge>
                ))}
            </div>
        );
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
                            <AlertTriangle /> Error de Carga
                        </CardTitle>
                        <CardDescription className="text-destructive/90">
                           No se pudieron cargar los datos. Revisa el mensaje de error.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                            {error}
                        </pre>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={fetchImpulseVisits} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Reintentar Conexión
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Detalle de Actividades de Impulso</CardTitle>
                    <CardDescription>
                        Lista de todas las actividades de "IMPULSACIÓN" que requieren material POP, con su costo asociado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-h-[65vh] overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead className="w-28">Fecha</TableHead>
                                    <TableHead>Ejecutiva de Trade</TableHead>
                                    <TableHead>Asesor Comercial</TableHead>
                                    <TableHead>Cadena</TableHead>
                                    <TableHead>Materiales Requeridos (Cantidad x Nombre)</TableHead>
                                    <TableHead className="w-40 text-right">Costo Total Material</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visits.length > 0 ? (
                                    visits.map(visit => (
                                        <TableRow key={visit.id}>
                                            <TableCell>{visit['FECHA'] ? new Date(visit['FECHA']).toLocaleDateString('es-CO') : 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{visit['EJECUTIVA DE TRADE']}</TableCell>
                                            <TableCell>{visit['ASESOR COMERCIAL']}</TableCell>
                                            <TableCell>{visit['CADENA']}</TableCell>
                                            <TableCell>{formatMaterialDetails(visit.visit_materials)}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {(visit.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No se encontraron actividades de impulso con materiales asignados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Wrench /> Logística de Materiales
                    </h1>
                    <p className="text-muted-foreground">Planifique y visualice los costos de material para actividades de impulso.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    title="Actividades de Impulso"
                    value={kpis.totalActivities}
                    icon={Activity}
                    description="Total de impulsos con material POP asignado"
                />
                 <KpiCard
                    title="Costo Total de Materiales"
                    value={(kpis.totalMaterialCost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    icon={DollarSign}
                    description="Suma del costo de todos los materiales"
                />
                 <KpiCard
                    title="Total de Artículos"
                    value={kpis.totalItems.toLocaleString('es-CO')}
                    icon={Package}
                    description="Suma de todas las unidades de material"
                />
            </div>
            
            {renderContent()}
        </div>
    );
}
