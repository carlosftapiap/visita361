

"use client"

import { useMemo, useState, useRef } from "react";
import { Users, Building, CalendarDays, Activity, Download, BarChart2, PieChart as PieIcon, Network, DollarSign, Pencil, CalendarOff, Package, PackageCheck, Filter } from "lucide-react";
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
import ActivityCalendar from "./activity-calendar";
import { materialsList } from "@/lib/materials";
import { cn } from "@/lib/utils";

interface DashboardProps {
    data: Visit[];
    allVisits: Visit[];
    onEditVisit: (visit: Visit) => void;
    onDeleteVisit: (visit: Visit) => void;
    isAdmin: boolean;
    filters: {
        month: string;
        trade_executive: string;
        agent: string;
    };
    onFilterChange: (filterName: keyof DashboardProps['filters'], value: string) => void;
}

const chartColors = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))"
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatMaterialPopForTable = (materials?: Record<string, number>): string => {
    if (!materials || Object.keys(materials).length === 0) {
        return '';
    }
    return Object.entries(materials)
        .map(([key, value]) => `${key}(${value})`)
        .join(', ');
};

export default function Dashboard({ data, allVisits, onEditVisit, onDeleteVisit, isAdmin, filters, onFilterChange }: DashboardProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [localFilters, setLocalFilters] = useState({
        city: 'all',
        activity: 'all',
        zone: 'all',
        chain: 'all',
    });

    const filterOptions = useMemo(() => {
        const getUniqueNonEmpty = (items: (string | null | undefined)[]) => 
            ['all', ...[...new Set(items.filter((item): item is string => !!item && item.trim() !== ''))].sort()];
        
        const cities = getUniqueNonEmpty(data.map(v => v['CIUDAD']));
        const activities = getUniqueNonEmpty(data.map(v => v['ACTIVIDAD']));
        const zones = getUniqueNonEmpty(data.map(v => v['ZONA']));
        const chains = getUniqueNonEmpty(data.map(v => v['CADENA']));
        
        return { cities, activities, zones, chains };
    }, [data]);

    const handleLocalFilterChange = (filterName: keyof typeof localFilters) => (value: string) => {
        setLocalFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(visit => {
            const cityMatch = localFilters.city === 'all' || visit['CIUDAD'] === localFilters.city;
            const activityMatch = localFilters.activity === 'all' || visit['ACTIVIDAD'] === localFilters.activity;
            const zoneMatch = localFilters.zone === 'all' || visit['ZONA'] === localFilters.zone;
            const chainMatch = localFilters.chain === 'all' || visit['CADENA'] === localFilters.chain;
            return cityMatch && activityMatch && zoneMatch && chainMatch;
        });
    }, [data, localFilters]);

    const activityCounts = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            const activityName = visit['ACTIVIDAD'] || 'No especificada';
            acc[activityName] = (acc[activityName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [filteredData]);
    
    const activityChartConfig: ChartConfig = {
      value: { label: 'Actividades' },
      ...activityCounts.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    };

    const visitsPerAgent = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            const agentName = visit['ASESOR COMERCIAL'] || 'No especificado';
            acc[agentName] = (acc[agentName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits);
    }, [filteredData]);
    
    const visitsPerTradeExecutive = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            const executiveName = visit['EJECUTIVA DE TRADE'] || 'No especificada';
            acc[executiveName] = (acc[executiveName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, visits: value })).sort((a, b) => b.visits - a.visits);
    }, [filteredData]);

    const visitsChartConfig: ChartConfig = {
        visits: { label: "Visitas", color: "hsl(var(--primary))" },
    };

    const visitsPerChannel = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            const channel = visit['CANAL'] || 'No especificado';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const channelChartConfig: ChartConfig = {
        value: { label: 'Canales' },
        ...visitsPerChannel.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    };

    const handleDownloadExcel = () => {
        if (filteredData.length === 0) return;

        const dataToExport = filteredData.map(visit => {
            const baseData = {
                'EJECUTIVA DE TRADE': visit['EJECUTIVA DE TRADE'],
                'ASESOR COMERCIAL': visit['ASESOR COMERCIAL'],
                'CANAL': visit['CANAL'],
                'CADENA': visit['CADENA'],
                'DIRECCIÓN DEL PDV': visit['DIRECCIÓN DEL PDV'],
                'ACTIVIDAD': visit['ACTIVIDAD'],
                'HORARIO': visit['HORARIO'],
                'CIUDAD': visit['CIUDAD'],
                'ZONA': visit['ZONA'],
                'FECHA': visit['FECHA'] ? new Date(visit['FECHA']).toLocaleDateString('es-CO') : '',
                'PRESUPUESTO': visit['PRESUPUESTO'],
                'COSTO TOTAL MATERIALES': visit.total_cost || 0,
                'AFLUENCIA ESPERADA': visit['AFLUENCIA ESPERADA'],
                'FECHA DE ENTREGA DE MATERIAL': visit['FECHA DE ENTREGA DE MATERIAL'] ? new Date(visit['FECHA DE ENTREGA DE MATERIAL']).toLocaleDateString('es-CO') : '',
                'OBJETIVO DE LA ACTIVIDAD': visit['OBJETIVO DE LA ACTIVIDAD'],
                'CANTIDAD DE MUESTRAS': visit['CANTIDAD DE MUESTRAS'],
                'OBSERVACION': visit['OBSERVACION'],
            };

            const materialsData: Record<string, number> = {};
            materialsList.forEach(materialName => {
                materialsData[`CANTIDAD ${materialName}`] = visit['MATERIAL POP']?.[materialName] || 0;
            });
            
            return { ...baseData, ...materialsData };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Visitas");
        XLSX.writeFile(wb, "Visita360_Reporte_Detallado.xlsx");
    };

    const handleDownloadPdf = () => {
        if (filteredData.length === 0) return;

        const doc = new jsPDF();
        
        const mainTitle = "Reporte de Actividades - Visita360";
        const date = `Fecha: ${format(new Date(), 'dd/MM/yyyy')}`;
        const monthLabel = capitalize(format(startOfMonth(new Date(filters.month + '-02')), 'MMMM yyyy', { locale: es }));
        
        const filterText = `Filtros Aplicados: 
        - Mes: ${monthLabel}
        - Ejecutiva: ${filters.trade_executive === 'all' ? 'Todas' : filters.trade_executive}
        - Asesor: ${filters.agent === 'all' ? 'Todos' : filters.agent}
        - Ciudad: ${localFilters.city === 'all' ? 'Todas' : localFilters.city}
        - Cadena: ${localFilters.chain === 'all' ? 'Todas' : localFilters.chain}
        - Zona: ${localFilters.zone === 'all' ? 'Todas' : localFilters.zone}
        - Actividad: ${localFilters.activity === 'all' ? 'Todas' : localFilters.activity}`;

        doc.setFontSize(18);
        doc.text(mainTitle, 14, 22);
        doc.setFontSize(11);
        doc.text(date, 14, 30);
        
        doc.setFontSize(10);
        doc.text(filterText, 14, 38);

        const tableColumn = ["Fecha", "Ejecutiva", "Asesor", "Cadena", "Actividad", "Costo Materiales", "Presupuesto"];
        const tableRows: any[][] = [];

        filteredData.forEach(visit => {
            const visitData = [
                visit['FECHA'] ? new Date(visit['FECHA']).toLocaleDateString('es-CO') : 'N/A',
                visit['EJECUTIVA DE TRADE'],
                visit['ASESOR COMERCIAL'],
                visit['CADENA'],
                visit['ACTIVIDAD'],
                visit.total_cost ? visit.total_cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$0',
                visit['PRESUPUESTO'] ? visit['PRESUPUESTO'].toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$0'
            ];
            tableRows.push(visitData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            headStyles: { fillColor: [75, 0, 130] }, // Indigo
        });
        
        doc.save(`Visita360_Reporte_${filters.month}.pdf`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div ref={calendarRef}>
                <ActivityCalendar 
                    data={data}
                    filters={filters}
                    onFilterChange={onFilterChange}
                    allVisits={allVisits}
                    onEditVisit={onEditVisit}
                    onDeleteVisit={onDeleteVisit}
                    isAdmin={isAdmin}
                />
            </div>
            
             <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><Filter className="text-primary"/> Filtros del Panel</CardTitle>
                    <CardDescription>Refine los datos para un análisis más detallado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                         <div>
                            <label className="text-sm font-medium">Ciudad</label>
                            <Select onValueChange={handleLocalFilterChange('city')} defaultValue="all" disabled={filterOptions.cities.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.cities.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todas las ciudades' : c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cadena</label>
                            <Select onValueChange={handleLocalFilterChange('chain')} defaultValue="all" disabled={filterOptions.chains.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.chains.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todas las cadenas' : c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Zona</label>
                            <Select onValueChange={handleLocalFilterChange('zone')} defaultValue="all" disabled={filterOptions.zones.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z === 'all' ? 'Todas las zonas' : z}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Actividad</label>
                            <Select onValueChange={handleLocalFilterChange('activity')} defaultValue="all" disabled={filterOptions.activities.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.activities.map(a => <SelectItem key={a} value={a}>{a === 'all' ? 'Todas las actividades' : a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleDownloadPdf} variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Reporte PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                     <Button variant="outline" size="icon" onClick={handleDownloadExcel} disabled={filteredData.length === 0} title="Descargar Excel">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descargar Excel</span>
                    </Button>
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
                                {filteredData.length > 0 ? filteredData.map(visit => (
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

        </div>
    );

    
