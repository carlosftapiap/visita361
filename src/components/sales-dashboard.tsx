
"use client";

import { useMemo, useState } from "react";
import type { Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { DollarSign, ShoppingCart, Percent, RotateCcw, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import KpiCard from "./kpi-card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface SalesDashboardProps {
    data: Sale[];
    onReset: () => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const chartConfig: ChartConfig = {
    value: { label: "Valor", color: "hsl(var(--primary))" },
};

export default function SalesDashboard({ data, onReset }: SalesDashboardProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const availableMonths = useMemo(() => {
        const monthSet = new Set<string>();
        data.forEach(sale => {
            monthSet.add(format(new Date(sale.FECHA), 'yyyy-MM'));
        });
        const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
        return sortedMonths.map(key => ({
            value: key,
            label: capitalize(format(new Date(key + '-15'), 'MMMM yyyy', { locale: es })),
        }));
    }, [data]);

    const filteredData = useMemo(() => {
        if (selectedMonth === 'all') return data;
        return data.filter(sale => format(new Date(sale.FECHA), 'yyyy-MM') === selectedMonth);
    }, [data, selectedMonth]);

    const kpis = useMemo(() => {
        const totalSales = filteredData.reduce((sum, sale) => sum + sale.DOLARES, 0);
        const totalCost = filteredData.reduce((sum, sale) => sum + (sale.COSTO_PROMEDIO * sale.UNIDADES), 0);
        const totalQuantity = filteredData.reduce((sum, sale) => sum + sale.UNIDADES, 0);
        const grossMargin = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0;
        const averageTicket = filteredData.length > 0 ? totalSales / filteredData.length : 0;
        
        return {
            totalSales,
            totalQuantity,
            grossMargin,
            averageTicket
        };
    }, [filteredData]);

    const salesBySeller = useMemo(() => {
        const sellerData = filteredData.reduce((acc, sale) => {
            const seller = sale.ASESOR || 'Desconocido';
            if (!acc[seller]) {
                acc[seller] = { sales: 0, units: 0 };
            }
            acc[seller].sales += sale.DOLARES;
            acc[seller].units += sale.UNIDADES;
            return acc;
        }, {} as Record<string, { sales: number; units: number }>);

        const salesRanking = Object.entries(sellerData).map(([name, data]) => ({ name, value: data.sales }))
            .sort((a, b) => b.value - a.value).slice(0, 10);
        
        const unitsRanking = Object.entries(sellerData).map(([name, data]) => ({ name, value: data.units }))
            .sort((a, b) => b.value - a.value).slice(0, 10);

        return { salesRanking, unitsRanking };

    }, [filteredData]);


    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline text-xl">Dashboard de Ventas</CardTitle>
                        <CardDescription>Métricas clave del archivo cargado. Filtre por mes para un análisis detallado.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filtrar por mes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Acumulado Total</SelectItem>
                                {availableMonths.map(month => (
                                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Cargar Otro Archivo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            title="Margen Bruto Est." 
                            value={`${kpis.grossMargin.toFixed(1)}%`}
                            icon={Percent}
                        />
                         <KpiCard 
                            title="Ticket Promedio" 
                            value={kpis.averageTicket.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} 
                            icon={TrendingUp}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Top Vendedores por Ventas (USD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-80 w-full">
                            <BarChart data={salesBySeller.salesRanking} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100} 
                                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} 
                                />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={4}>
                                    <LabelList 
                                        dataKey="value"
                                        position="right"
                                        offset={8}
                                        className="fill-foreground"
                                        fontSize={12}
                                        formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Vendedores por Unidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={chartConfig} className="h-80 w-full">
                            <BarChart data={salesBySeller.unitsRanking} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100} 
                                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} 
                                />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4}>
                                     <LabelList 
                                        dataKey="value"
                                        position="right"
                                        offset={8}
                                        className="fill-foreground"
                                        fontSize={12}
                                        formatter={(value: number) => value.toLocaleString('es-CO')}
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
