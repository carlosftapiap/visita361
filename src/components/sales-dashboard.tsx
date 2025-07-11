
"use client";

import { useMemo } from "react";
import type { Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ShoppingCart, Users, RotateCcw } from "lucide-react";
import KpiCard from "./kpi-card";

interface SalesDashboardProps {
    data: Sale[];
    onReset: () => void;
}

export default function SalesDashboard({ data, onReset }: SalesDashboardProps) {

    const kpis = useMemo(() => {
        const totalSales = data.reduce((sum, sale) => sum + sale.DOLARES, 0);
        const totalQuantity = data.reduce((sum, sale) => sum + sale.UNIDADES, 0);
        const uniqueProducts = new Set(data.map(s => s['PRODUCTO SISTEMA'])).size;
        
        return {
            totalSales,
            totalQuantity,
            uniqueProducts,
        };
    }, [data]);

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-xl">Resumen de Ventas</CardTitle>
                        <CardDescription>Métricas clave del archivo cargado.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={onReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Cargar Otro Archivo
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard 
                            title="Ventas Totales (USD)" 
                            value={kpis.totalSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} 
                            icon={DollarSign}
                        />
                        <KpiCard 
                            title="Unidades Vendidas" 
                            value={kpis.totalQuantity.toLocaleString('es-CO')}
                            icon={ShoppingCart}
                        />
                        <KpiCard 
                            title="Productos Únicos" 
                            value={kpis.uniqueProducts.toLocaleString('es-CO')} 
                            icon={Users}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Ventas</CardTitle>
                    <CardDescription>Tabla con los registros de ventas del archivo.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="relative max-h-96 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Asesor</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Producto Sistema</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Forma</TableHead>
                                    <TableHead className="text-right">Unidades</TableHead>
                                    <TableHead className="text-right">Venta (USD)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((sale, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(sale.FECHA).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</TableCell>
                                        <TableCell className="font-medium">{sale.ASESOR}</TableCell>
                                        <TableCell>{sale.CLIENTE}</TableCell>
                                        <TableCell>{sale['PRODUCTO SISTEMA']}</TableCell>
                                        <TableCell>{sale.DATA}</TableCell>
                                        <TableCell>{sale.FORMA}</TableCell>
                                        <TableCell className="text-right">{sale.UNIDADES.toLocaleString('es-CO')}</TableCell>
                                        <TableCell className="text-right font-mono">{sale.DOLARES.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
