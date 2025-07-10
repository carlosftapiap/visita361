
"use client";

import type { VisitWithMaterials } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import KpiCard from '@/components/kpi-card';
import { Package, DollarSign, List } from 'lucide-react';

interface LogisticsDashboardProps {
    logisticsData: VisitWithMaterials[];
    kpis: {
        totalActivities: number;
        totalCost: number;
        totalItems: number;
    };
}

const formatMaterialPopForTable = (materials?: { name: string, quantity: number }[]): string => {
    if (!materials || materials.length === 0) {
        return 'N/A';
    }
    return materials
        .map(item => `${item.name} (${item.quantity})`)
        .join(', ');
};

export default function LogisticsDashboard({ logisticsData, kpis }: LogisticsDashboardProps) {
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
                                            <TableCell>{new Date(visit.FECHA).toLocaleDateString('es-CO')}</TableCell>
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
