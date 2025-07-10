
"use client"

import { useMemo, useState, useRef } from "react";
import { Users, Building, CalendarDays, Activity, Download, BarChart2, PieChart as PieIcon, Network, DollarSign, Pencil, CalendarOff, Package, PackageCheck } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getDaysInMonth } from 'date-fns';

import type { Visit } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import KpiCard from "./kpi-card";
import ActivityCalendar from "./activity-calendar";
import { materialsList } from "@/lib/materials";

interface DashboardProps {
    data: Visit[];
    onEditVisit: (visit: Visit) => void;
}

const chartColors = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))"
];

const formatMaterialPopForTable = (materials?: Record<string, number>): string => {
    if (!materials || Object.keys(materials).length === 0) {
        return '';
    }
    return Object.entries(materials)
        .map(([key, value]) => `${key}(${value})`)
        .join(', ');
};

export default function Dashboard({ data, onEditVisit }: DashboardProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState({
        trade_executive: 'all',
        agent: 'all',
        city: 'all',
        activity: 'all',
        zone: 'all',
        chain: 'all',
    });

    const filterOptions = useMemo(() => {
        const getUniqueNonEmpty = (items: (string | null | undefined)[]) => 
            ['all', ...[...new Set(items.filter((item): item is string => !!item && item.trim() !== ''))].sort()];

        const trade_executives = getUniqueNonEmpty(data.map(v => v['EJECUTIVA DE TRADE']));
        
        const relevantAgentsData = filters.trade_executive === 'all'
            ? data
            : data.filter(v => v['EJECUTIVA DE TRADE'] === filters.trade_executive);
        const agents = getUniqueNonEmpty(relevantAgentsData.map(v => v['ASESOR COMERCIAL']));

        const cities = getUniqueNonEmpty(data.map(v => v['CIUDAD']));
        const activities = getUniqueNonEmpty(data.map(v => v['ACTIVIDAD']));
        const zones = getUniqueNonEmpty(data.map(v => v['ZONA']));
        const chains = getUniqueNonEmpty(data.map(v => v['CADENA']));
        
        return { trade_executives, agents, cities, activities, zones, chains };
    }, [data, filters.trade_executive]);

    const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'trade_executive') {
                newFilters.agent = 'all';
            }
            return newFilters;
        });
    };

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(visit => {
            const tradeExecutiveMatch = filters.trade_executive === 'all' || visit['EJECUTIVA DE TRADE'] === filters.trade_executive;
            const agentMatch = filters.agent === 'all' || visit['ASESOR COMERCIAL'] === filters.agent;
            const cityMatch = filters.city === 'all' || visit['CIUDAD'] === filters.city;
            const activityMatch = filters.activity === 'all' || visit['ACTIVIDAD'] === filters.activity;
            const zoneMatch = filters.zone === 'all' || visit['ZONA'] === filters.zone;
            const chainMatch = filters.chain === 'all' || visit['CADENA'] === filters.chain;
            return tradeExecutiveMatch && agentMatch && cityMatch && activityMatch && zoneMatch && chainMatch;
        });
    }, [data, filters]);

    const kpis = useMemo(() => {
        const totalVisits = filteredData.length;
        const uniqueAgents = new Set(filteredData.map(v => v['ASESOR COMERCIAL']).filter(Boolean)).size;
        const uniqueChains = new Set(filteredData.map(v => v['CADENA']).filter(Boolean)).size;

        const today = new Date();
        const daysInCurrentMonth = getDaysInMonth(today);
        
        const dataInCurrentMonth = filteredData.filter(v => {
            const visitDate = new Date(v['FECHA']);
            return visitDate.getMonth() === today.getMonth() && 
                   visitDate.getFullYear() === today.getFullYear();
        });

        const workedDaysSet = new Set<string>();
        const freeDaysSet = new Set<string>();

        dataInCurrentMonth.forEach(v => {
            const dayKey = new Date(v['FECHA']).toISOString().split('T')[0];
            if (v['ACTIVIDAD']?.toUpperCase() === 'LIBRE') {
                freeDaysSet.add(dayKey);
            } else {
                workedDaysSet.add(dayKey);
            }
        });
        
        const workedDaysInCurrentMonth = workedDaysSet.size;
        const freeDaysInCurrentMonth = freeDaysSet.size;

        const totalBudget = filteredData.reduce((sum, visit) => sum + (visit['PRESUPUESTO'] || 0), 0);
        const totalMaterialCost = filteredData.reduce((sum, visit) => sum + (visit.total_cost || 0), 0);
        const totalSamples = filteredData.reduce((sum, visit) => sum + (visit['CANTIDAD DE MUESTRAS'] || 0), 0);

        return { 
            totalVisits, 
            uniqueAgents, 
            uniqueChains, 
            workedDays: workedDaysInCurrentMonth,
            freeDays: freeDaysInCurrentMonth,
            daysInMonth: daysInCurrentMonth,
            totalBudget,
            totalMaterialCost,
            totalSamples
        };
    }, [filteredData]);

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
        const calendarElement = calendarRef.current;
        if (!calendarElement || filteredData.length === 0) return;

        html2canvas(calendarElement, {
            scale: 3, // Increased scale for better quality
            useCORS: true,
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save("Visita360_Calendario.pdf");
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Filtros del Panel</CardTitle>
                    <CardDescription>Refine los datos para un análisis más detallado.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-2">
                             <label className="text-sm font-medium">Ciudad</label>
                            <Select value={filters.city} onValueChange={handleFilterChange('city')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.cities.map(city => (<SelectItem key={city} value={city}>{city === 'all' ? 'Todas las ciudades' : city}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-2">
                             <label className="text-sm font-medium">Cadena</label>
                            <Select value={filters.chain} onValueChange={handleFilterChange('chain')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.chains.map(chain => (<SelectItem key={chain} value={chain}>{chain === 'all' ? 'Todas las cadenas' : chain}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-2">
                             <label className="text-sm font-medium">Zona</label>
                            <Select value={filters.zone} onValueChange={handleFilterChange('zone')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.zones.map(zone => (<SelectItem key={zone} value={zone}>{zone === 'all' ? 'Todas las zonas' : zone}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                             <label className="text-sm font-medium">Actividad</label>
                            <Select value={filters.activity} onValueChange={handleFilterChange('activity')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.activities.map(activity => (<SelectItem key={activity} value={activity}>{activity === 'all' ? 'Todas las actividades' : activity}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownloadPdf} disabled={filteredData.length === 0}><Download className="mr-2 h-4 w-4" /> Calendario PDF</Button>
                    </div>
                </CardContent>
            </Card>

            <div ref={calendarRef}>
                <ActivityCalendar 
                    data={filteredData}
                    executives={filterOptions.trade_executives}
                    agents={filterOptions.agents}
                    selectedExecutive={filters.trade_executive}
                    selectedAgent={filters.agent}
                    onExecutiveChange={handleFilterChange('trade_executive')}
                    onAgentChange={handleFilterChange('agent')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard title="Total de Actividades" value={kpis.totalVisits} icon={Activity} description="Total de registros en el periodo" />
                <KpiCard title="Asesores Activos" value={kpis.uniqueAgents} icon={Users} description="Asesores con actividad registrada" />
                <KpiCard title="Cadenas Únicas" value={kpis.uniqueChains} icon={Building} description="Cadenas distintas visitadas" />
                <KpiCard title="Días con Actividad" value={kpis.workedDays} icon={CalendarDays} description={`En el mes actual (${kpis.daysInMonth} días)`} />
                <KpiCard title="Días Libres" value={kpis.freeDays} icon={CalendarOff} description={`En el mes actual (${kpis.daysInMonth} días)`} />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><DollarSign className="text-accent"/>Resumen Financiero y de Unidades</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KpiCard 
                            title="Presupuesto Total" 
                            value={kpis.totalBudget.toLocaleString('es-CO')}
                            icon={DollarSign} 
                            description="Suma de presupuestos en el periodo" 
                        />
                         <KpiCard 
                            title="Costo Total de Materiales" 
                            value={kpis.totalMaterialCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                            icon={Package} 
                            description="Costo total de materiales en el periodo" 
                        />
                        <KpiCard
                            title="Total de Muestras"
                            value={kpis.totalSamples.toLocaleString('es-CO')}
                            icon={PackageCheck}
                            description="Suma total de muestras entregadas"
                        />
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
                                        <TableCell className="text-right font-mono">{visit['PRESUPUESTO'] ? visit['PRESUPUESTO'].toLocaleString('es-CO', { style: 'currency', currency: 'COP'}) : 'N/A'}</TableCell>
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
}
