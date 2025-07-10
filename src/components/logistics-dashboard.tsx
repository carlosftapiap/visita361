
"use client";

import { useMemo } from 'react';
import type { VisitWithMaterials, Visit, Material, VisitMaterial } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import KpiCard from '@/components/kpi-card';
import { Package, DollarSign, List } from 'lucide-react';

interface LogisticsDashboardProps {
    visits: Visit[];
    materials: Material[];
    visitMaterials: VisitMaterial[];
}

const formatMaterialPopForTable = (materials?: { name: string, quantity: number, unit_price: number }[]): string => {
    if (!materials || materials.length === 0) {
        return 'N/A';
    }
    return materials
        .map(item => `${item.name} (${item.quantity})`)
        .join(', ');
};

export default function LogisticsDashboard({ visits, materials, visitMaterials }: LogisticsDashboardProps) {

    const { processedData, kpis } = useMemo(() => {
        const materialMap = new Map(materials.map(m => [m.id, m]));
        
        // KPI 1: Contar todas las actividades de impulsación, tengan o no materiales.
        const totalImpulseActivities = visits.filter(v => v.ACTIVIDAD === 'IMPULSACIÓN').length;

        const logisticsData: VisitWithMaterials[] = visits
            .filter(v => v.ACTIVIDAD === 'IMPULSACIÓN') // Start with all impulse activities
            .map(visit => {
                const materialsForVisit = visitMaterials.filter(vm => vm.visit_id === visit.id);
                
                const materials_list = materialsForVisit.map(vm => {
                    const materialDetail = materialMap.get(vm.material_id);
                    return {
                        name: materialDetail?.name || 'Desconocido',
                        quantity: vm.quantity,
                        unit_price: materialDetail?.unit_price || 0,
                    };
                });

                const total_cost = materials_list.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
                
                return {
                    ...visit,
                    materials_list,
                    total_cost,
                };
            })
            // Now, for the table, filter to only those that ended up having materials
            .filter(v => v.materials_list.length > 0);

        // KPI 2 y 3: Costo y artículos, basados en los datos procesados (solo impulsos CON materiales)
        const totalCost = logisticsData.reduce((sum, visit) => sum + visit.total_cost, 0);
        const totalItems = logisticsData.reduce((sum, visit) => {
            return sum + visit.materials_list.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        return {
            processedData: logisticsData,
            kpis: {
                totalActivities: totalImpulseActivities,
                totalCost,
                totalItems,
            }
        };
    }, [visits, materials, visitMaterials]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Actividades de Impulsación"
                    value={kpis.totalActivities}
                    icon={Package}
                    description="Total de actividades de impulsación planificadas."
                />
                <KpiCard
                    title="Costo Total de Materiales"
                    value={kpis.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    icon={DollarSign}
                    description="Suma del costo de materiales para impulsos."
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
                                {processedData.length > 0 ? (
                                    processedData.map(visit => (
                                        <TableRow key={visit.id}>
                                            <TableCell>{new Date(visit['FECHA']).toLocaleDateString('es-CO')}</TableCell>
                                            <TableCell>{visit['EJECUTIVA DE TRADE']}</TableCell>
                                            <TableCell>{visit.ACTIVIDAD}</TableCell>
                                            <TableCell>{`${visit.CADENA} / ${visit['DIRECCIÓN DEL PDV']}`}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {formatMaterialPopForTable(visit.materials_list)}
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
