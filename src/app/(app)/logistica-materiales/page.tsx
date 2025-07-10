
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, DollarSign, List, Truck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import type { Visit, Material, VisitWithMaterials } from '@/types';
import { getVisits, getMaterials } from '@/services/visitService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import KpiCard from '@/components/kpi-card';
import DashboardSkeleton from '@/components/dashboard-skeleton';

const formatMaterialPopForTable = (visit?: VisitWithMaterials): string => {
    if (!visit?.visit_materials || visit.visit_materials.length === 0) {
        return 'N/A';
    }
    return visit.visit_materials
        .map(item => `${item.materials.name} (${item.quantity})`)
        .join(', ');
};

function LogisticsDashboard({ logisticsData, kpis }: { logisticsData: VisitWithMaterials[], kpis: any }) {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Actividades de Impulsación"
                    value={kpis.totalActivities}
                    icon={Package}
                    description="Total de actividades de impulsación con material."
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
                        Listado de todas las actividades de impulsación que requieren materiales, con su costo asociado.
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
                                {logisticsData.length > 0 ? (
                                    logisticsData.map(visit => (
                                        <TableRow key={visit.id}>
                                            <TableCell>{new Date(visit.FECHA).toLocaleDateString()}</TableCell>
                                            <TableCell>{visit['EJECUTIVA DE TRADE']}</TableCell>
                                            <TableCell>{visit.ACTIVIDAD}</TableCell>
                                            <TableCell>{`${visit.CADENA} / ${visit['DIRECCIÓN DEL PDV']}`}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {formatMaterialPopForTable(visit)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {(visit.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No se encontraron actividades de impulsación que requieran materiales.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}


export default function LogisticaMaterialesPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [visitsData, materialsData] = await Promise.all([
                getVisits(),
                getMaterials()
            ]);
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

    const { logisticsData, kpis } = useMemo(() => {
        const initialKpis = { totalActivities: 0, totalCost: 0, totalItems: 0 };
        if (visits.length === 0 || materials.length === 0) {
            return { logisticsData: [], kpis: initialKpis };
        }

        const materialPriceMap = new Map(materials.map(m => [m.id, m.unit_price]));
        const materialNameMap = new Map(materials.map(m => [m.id, m.name]));

        const impulseVisitsWithMaterials = (visits as VisitWithMaterials[]).filter(visit =>
            visit.ACTIVIDAD === 'IMPULSACIÓN' &&
            visit.visit_materials &&
            visit.visit_materials.length > 0
        );
        
        const calculatedLogisticsData = impulseVisitsWithMaterials.map(visit => {
            const cost = visit.visit_materials.reduce((acc, item) => {
                const materialId = item.material_id;
                const price = materialPriceMap.get(materialId) || 0;
                return acc + (price * item.quantity);
            }, 0);

            const populatedMaterials = visit.visit_materials.map(item => ({
                ...item,
                materials: {
                    id: item.material_id,
                    name: materialNameMap.get(item.material_id) || 'Desconocido',
                    unit_price: materialPriceMap.get(item.material_id) || 0
                }
            }));

            return { ...visit, total_cost: cost, visit_materials: populatedMaterials };
        });

        const totalActivities = calculatedLogisticsData.length;
        const totalCost = calculatedLogisticsData.reduce((sum, visit) => sum + (visit.total_cost || 0), 0);
        const totalItems = calculatedLogisticsData.reduce((sum, visit) => {
            return sum + visit.visit_materials.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        return {
            logisticsData: calculatedLogisticsData,
            kpis: { totalActivities, totalCost, totalItems }
        };
    }, [visits, materials]);

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

        return <LogisticsDashboard logisticsData={logisticsData} kpis={kpis} />;
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Truck /> Logística de Materiales
                    </h1>
                    <p className="text-muted-foreground">Planifique y visualice los costos de material para actividades de impulsación.</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}
