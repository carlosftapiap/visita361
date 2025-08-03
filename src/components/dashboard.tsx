

"use client"

import { useMemo, useState, useRef } from "react";
import { Users, Building, CalendarDays, Activity, Download, BarChart2, PieChart as PieIcon, Network, DollarSign, Pencil, CalendarOff, Package, PackageCheck, Filter, TrendingUp, CalendarClock } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { getDaysInMonth, format, startOfMonth } from 'date-fns';
import { es } from "date-fns/locale";

import type { Visit } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import KpiCard from "./kpi-card";
import { materialsList } from "@/lib/materials";
import { cn } from "@/lib/utils";

interface DashboardProps {
    data: Visit[];
    onEditVisit: (visit: Visit) => void;
    onDeleteVisit: (visit: Visit) => void;
    isAdmin: boolean;
    hasData: boolean;
}

const chartColors = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))"
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Dashboard({ data, onEditVisit, onDeleteVisit, isAdmin, hasData }: DashboardProps) {

    const { totalBudget, totalMaterialCost, totalSamples } = useMemo(() => {
        return data.reduce((acc, visit) => {
            acc.totalBudget += visit['PRESUPUESTO'] || 0;
            acc.totalMaterialCost += visit.total_cost || 0;
            acc.totalSamples += visit['CANTIDAD DE MUESTRAS'] || 0;
            return acc;
        }, { totalBudget: 0, totalMaterialCost: 0, totalSamples: 0 });
    }, [data]);

     const kpis = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalActivities: 0,
                activeDays: 0,
                freeDays: 30, // Default to 30, will be inaccurate if no data
                uniqueChains: 0
            };
        }
        
        const firstVisitDate = new Date(data[0].FECHA);
        const [year, month] = [firstVisitDate.getFullYear(), firstVisitDate.getMonth() + 1];
        const totalDaysInMonth = getDaysInMonth(new Date(year, month - 1));

        const uniqueDays = new Set<string>();
        data.forEach(visit => {
            const visitDate = new Date(visit.FECHA);
            const dateString = visitDate.getFullYear() + '-' + (visitDate.getMonth() + 1) + '-' + visitDate.getDate();
            uniqueDays.add(dateString);
        });
        
        const uniqueChains = new Set(data.map(v => v['CADENA']));
        const activeDays = uniqueDays.size;

        return {
            totalActivities: data.length,
            activeDays: activeDays,
            freeDays: totalDaysInMonth - activeDays,
            uniqueChains: uniqueChains.size
        };
    }, [data]);

    const activityCounts = useMemo(() => {
        const counts = data.reduce((acc, visit) => {
            const activityName = visit['ACTIVIDAD'] || 'No especificada';
            acc[activityName] = (acc[activityName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [data]);
    
    const activityChartConfig: ChartConfig = {
      value: { label: 'Actividades' },
      ...activityCounts.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    };

    const visitsPerAgent = useMemo(() => {
        const counts = data.reduce((acc, visit) => {
            const agentName = visit['ASESOR COMERCIAL'] || 'No especificado';
            acc[agentName] = (acc[agentName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits);
    }, [data]);
    
    const visitsPerTradeExecutive = useMemo(() => {
        const counts = data.reduce((acc, visit) => {
            const executiveName = visit['EJECUTIVA DE TRADE'] || 'No especificada';
            acc[executiveName] = (acc[executiveName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, visits: value })).sort((a, b) => b.visits - a.visits);
    }, [data]);

    const visitsChartConfig: ChartConfig = {
        visits: { label: "Visitas", color: "hsl(var(--primary))" },
    };

    const visitsPerChannel = useMemo(() => {
        const counts = data.reduce((acc, visit) => {
            const channel = visit['CANAL'] || 'No especificado';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [data]);

    const channelChartConfig: ChartConfig = {
        value: { label: 'Canales' },
        ...visitsPerChannel.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg relative overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">Presupuesto en Unidades</CardTitle>
                        <DollarSign className="h-5 w-5 text-primary-foreground/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-headline text-5xl font-bold">
                            {totalBudget.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-primary-foreground/80 mt-1">Suma de presupuestos en el periodo</p>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg relative overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">Costo de Materiales</CardTitle>
                        <PackageCheck className="h-5 w-5 text-primary-foreground/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-headline text-5xl font-bold">
                             {totalMaterialCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-primary-foreground/80 mt-1">Costo total de materiales en el periodo</p>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg relative overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">Total de Muestras</CardTitle>
                        <Package className="h-5 w-5 text-primary-foreground/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-headline text-5xl font-bold">
                            {totalSamples.toLocaleString('es-CO')}
                        </div>
                        <p className="text-xs text-primary-foreground/80 mt-1">Suma de muestras entregadas</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={Activity} title="Total de Actividades" value={kpis.totalActivities} description="Registros en el periodo filtrado"/>
                <KpiCard icon={CalendarDays} title="Días con Actividad" value={kpis.activeDays} description="Días únicos con al menos un registro"/>
                <KpiCard icon={CalendarOff} title="Días Libres" value={kpis.freeDays} description="Días del mes sin actividad registrada"/>
                <KpiCard icon={Building} title="Cadenas Únicas" value={kpis.uniqueChains} description="Cadenas distintas visitadas"/>
            </div>

            {hasData ? (
                <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
                        <Card className="shadow-lg lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><BarChart2 className="text-accent"/>Visitas por Ejecutiva de Trade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={visitsChartConfig} className="h-[300px] w-full">
                                    <BarChart accessibilityLayer data={visitsPerTradeExecutive} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} content={<ChartTooltipContent />} />
                                        <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><BarChart2 className="text-accent"/>Visitas por Asesor Comercial</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={visitsChartConfig} className="h-[300px] w-full">
                                    <BarChart accessibilityLayer data={visitsPerAgent} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} content={<ChartTooltipContent />} />
                                        <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><PieIcon className="text-accent"/>Distribución de Actividades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
                                    <PieChart accessibilityLayer>
                                        <Tooltip content={<ChartTooltipContent hideLabel nameKey="name"/>} />
                                        <Pie data={activityCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" labelLine={false} label>
                                            <LabelList dataKey="value" className="fill-background font-semibold" stroke="none" />
                                            {activityCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><Network className="text-accent"/>Visitas por Canal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={channelChartConfig} className="h-[300px] w-full">
                                    <PieChart accessibilityLayer>
                                        <Tooltip content={<ChartTooltipContent hideLabel nameKey="name"/>} />
                                        <Pie data={visitsPerChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" labelLine={false} label>
                                            <LabelList dataKey="value" className="fill-background font-semibold" stroke="none" />
                                            {visitsPerChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-xl">Detalle de Visitas</CardTitle>
                                <CardDescription>Tabla con todos los registros de visitas filtrados.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative max-h-96 overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Ejecutiva de Trade</TableHead>
                                            <TableHead>Asesor Comercial</TableHead>
                                            <TableHead>Cadena</TableHead>
                                            <TableHead>Actividad</TableHead>
                                            <TableHead className="text-right">Costo Materiales</TableHead>
                                            <TableHead className="text-right">Presupuesto</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length > 0 ? data.map(visit => (
                                            <TableRow key={visit.id}>
                                                <TableCell>{visit['FECHA'] ? new Date(visit['FECHA']).toLocaleDateString('es-CO') : 'N/A'}</TableCell>
                                                <TableCell>{visit['EJECUTIVA DE TRADE']}</TableCell>
                                                <TableCell className="font-medium">{visit['ASESOR COMERCIAL']}</TableCell>
                                                <TableCell>{visit['CADENA']}</TableCell>
                                                <TableCell>{visit['ACTIVIDAD']}</TableCell>
                                                <TableCell className="text-right font-mono">{visit.total_cost ? visit.total_cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$0'}</TableCell>
                                                <TableCell className="text-right font-mono">{visit['PRESUPUESTO'] ? visit['PRESUPUESTO'].toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => onEditVisit(visit)}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center">No hay datos para mostrar con los filtros seleccionados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                    <CardContent className="flex flex-col items-center gap-4 p-6">
                        <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                            <CalendarClock className="h-16 w-16 text-primary" />
                        </div>
                        <h2 className="font-headline text-2xl">No hay datos para este mes</h2>
                        <p className="max-w-xs text-muted-foreground">
                            Seleccione otro mes en el calendario, añada una visita manualmente o cargue un archivo de Excel para empezar.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
