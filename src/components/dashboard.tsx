"use client"

import { useMemo, useState } from "react";
import { Users, Building, CalendarDays, Activity, Download, BarChart2, PieChart as PieIcon, Wallet, Network } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import type { Visit } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import KpiCard from "./kpi-card";
import ActivityCalendar from "./activity-calendar";

interface DashboardProps {
    data: Visit[];
}

const chartColors = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))"
];

export default function Dashboard({ data }: DashboardProps) {
    const [filters, setFilters] = useState({
        agent: 'all',
        city: 'all',
        activity: 'all',
    });

    const filterOptions = useMemo(() => {
        const agents = ['all', ...Array.from(new Set(data.map(v => v.agent)))];
        const cities = ['all', ...Array.from(new Set(data.map(v => v.city)))];
        const activities = ['all', ...Array.from(new Set(data.map(v => v.activity)))];
        return { agents, cities, activities };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(visit => {
            const agentMatch = filters.agent === 'all' || visit.agent === filters.agent;
            const cityMatch = filters.city === 'all' || visit.city === filters.city;
            const activityMatch = filters.activity === 'all' || visit.activity === filters.activity;
            return agentMatch && cityMatch && activityMatch;
        });
    }, [data, filters]);

    const kpis = useMemo(() => {
        const totalVisits = filteredData.length;
        const uniqueAgents = new Set(filteredData.map(v => v.agent)).size;
        const uniqueClients = new Set(filteredData.map(v => v.client)).size;
        const workedDays = new Set(filteredData.map(v => v.date.toDateString())).size;
        const totalBudget = filteredData.reduce((sum, v) => sum + v.budget, 0);
        return { totalVisits, uniqueAgents, uniqueClients, workedDays, totalBudget };
    }, [filteredData]);

    const activityCounts = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            acc[visit.activity] = (acc[visit.activity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [filteredData]);
    
    const activityChartConfig = {
      value: { label: 'Actividades' },
      ...activityCounts.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    } satisfies ChartConfig

    const visitsPerAgent = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            acc[visit.agent] = (acc[visit.agent] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, visits: value })).sort((a, b) => b.visits - a.visits);
    }, [filteredData]);

    const agentChartConfig = {
        visits: { label: "Visitas", color: "hsl(var(--primary))" },
    } satisfies ChartConfig;

    const visitsPerChannel = useMemo(() => {
        const counts = filteredData.reduce((acc, visit) => {
            const channel = visit.channel || 'No especificado';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const channelChartConfig = {
        value: { label: 'Canales' },
        ...visitsPerChannel.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
    } satisfies ChartConfig;


    const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Filtros del Panel</CardTitle>
                    <CardDescription>Refine los datos para un análisis más detallado. Puede exportar los resultados filtrados.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Agente</label>
                            <Select value={filters.agent} onValueChange={handleFilterChange('agent')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.agents.map(agent => (<SelectItem key={agent} value={agent}>{agent === 'all' ? 'Todos los agentes' : agent}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                             <label className="text-sm font-medium">Ciudad</label>
                            <Select value={filters.city} onValueChange={handleFilterChange('city')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{filterOptions.cities.map(city => (<SelectItem key={city} value={city}>{city === 'all' ? 'Todas las ciudades' : city}</SelectItem>))}</SelectContent>
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
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel</Button>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> PDF</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <KpiCard title="Total de Actividades" value={kpis.totalVisits} icon={Activity} description="Total de registros en el periodo" />
                <KpiCard title="Agentes Activos" value={kpis.uniqueAgents} icon={Users} description="Agentes con actividad registrada" />
                <KpiCard title="Clientes Únicos" value={kpis.uniqueClients} icon={Building} description="Clientes distintos visitados" />
                <KpiCard title="Días Trabajados" value={kpis.workedDays} icon={CalendarDays} description="Días con al menos una actividad" />
                <KpiCard title="Presupuesto Total" value={new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(kpis.totalBudget)} icon={Wallet} description="Suma de presupuestos" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
                <Card className="shadow-lg lg:col-span-6">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><BarChart2 className="text-accent"/>Visitas por Agente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={agentChartConfig} className="h-64 w-full">
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
                         <ChartContainer config={activityChartConfig} className="h-64 w-full">
                            <PieChart accessibilityLayer>
                                <Tooltip content={<ChartTooltipContent hideLabel nameKey="name"/>} />
                                <Pie data={activityCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                  {activityCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><Network className="text-accent"/>Visitas por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={channelChartConfig} className="h-64 w-full">
                            <PieChart accessibilityLayer>
                                <Tooltip content={<ChartTooltipContent hideLabel nameKey="name"/>} />
                                <Pie data={visitsPerChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                  {visitsPerChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            
            <ActivityCalendar data={filteredData} />

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Detalle de Visitas</CardTitle>
                    <CardDescription>Tabla con todos los registros de visitas filtrados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-h-96 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Agente</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Detalle PDV</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Actividad</TableHead>
                                    <TableHead>Horario</TableHead>
                                    <TableHead>Canal</TableHead>
                                    <TableHead>Presupuesto</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length > 0 ? filteredData.map(visit => (
                                    <TableRow key={visit.id}>
                                        <TableCell className="font-medium">{visit.agent}</TableCell>
                                        <TableCell>{visit.client}</TableCell>
                                        <TableCell>{visit.pdv_detail}</TableCell>
                                        <TableCell>{visit.city}</TableCell>
                                        <TableCell>{visit.date.toLocaleDateString('es-CO')}</TableCell>
                                        <TableCell>{visit.activity}</TableCell>
                                        <TableCell>{visit.schedule}</TableCell>
                                        <TableCell>{visit.channel}</TableCell>
                                        <TableCell className="text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(visit.budget)}</TableCell>
                                        <TableCell className="max-w-xs truncate">{visit.observations}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">No hay datos para mostrar con los filtros seleccionados.</TableCell>
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
