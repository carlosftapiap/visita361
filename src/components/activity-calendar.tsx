
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, startOfMonth, parse, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, Building2, Network, Clock, MapPin, DollarSign, Users2, Calendar, Edit, Info, Package, Target, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Visit } from '@/types';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ActivityCalendarProps {
  data: Visit[];
  allVisits: Visit[];
  filters: {
      month: string;
      trade_executive: string;
      agent: string;
  };
  onFilterChange: (filterName: keyof ActivityCalendarProps['filters'], value: string) => void;
  onEditVisit: (visit: Visit) => void;
  onDeleteVisit: (visit: Visit) => void;
  isAdmin: boolean;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const chartColors = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))", 
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];

export default function ActivityCalendar({ 
  data,
  allVisits,
  filters,
  onFilterChange,
  onEditVisit,
  onDeleteVisit,
  isAdmin
}: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    const newDate = parse(filters.month, 'yyyy-MM', new Date());
    setCurrentDate(newDate);
  }, [filters.month]);
  
  const executiveColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const allExecutives = [...new Set(data.map(d => d['EJECUTIVA DE TRADE']))];
    allExecutives.forEach((exec, index) => {
      map[exec] = chartColors[index % chartColors.length];
    });
    return map;
  }, [data]);
  
  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    const newMonthFilter = format(newDate, 'yyyy-MM');
    onFilterChange('month', newMonthFilter);
    setCurrentDate(newDate);
  };

  const monthOptions = useMemo(() => {
    const monthSet = new Set<string>();
    allVisits.forEach(visit => {
        monthSet.add(format(new Date(visit['FECHA']), 'yyyy-MM'));
    });
    
    const today = new Date();
    for (let i = -6; i <= 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        monthSet.add(format(date, 'yyyy-MM'));
    }

    return Array.from(monthSet)
        .sort((a,b) => b.localeCompare(a))
        .map(monthStr => ({
            value: monthStr,
            label: capitalize(format(parse(monthStr, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es }))
        }));
  }, [allVisits]);
  
  const agentOptions = useMemo(() => {
      const agents = ['all', ...Array.from(new Set(allVisits.map(v => v['ASESOR COMERCIAL']).filter(Boolean)))];
      return agents.sort();
  }, [allVisits]);

  const tradeExecutiveOptions = useMemo(() => {
      const executives = ['all', ...Array.from(new Set(allVisits.map(v => v['EJECUTIVA DE TRADE']).filter(Boolean)))];
      return executives.sort();
  }, [allVisits]);
  
  const startDay = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });

  const groupedVisitsByDay = useMemo(() => {
    const groups: Record<string, Record<string, Visit[]>> = {};

    data.forEach(visit => {
      const visitDate = parseISO(visit.FECHA);
      const visitDateUTC = new Date(Date.UTC(visitDate.getUTCFullYear(), visitDate.getUTCMonth(), visitDate.getUTCDate()));
      const dateKey = format(visitDateUTC, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }
      
      const executive = visit['EJECUTIVA DE TRADE'];
      if (!groups[dateKey][executive]) {
        groups[dateKey][executive] = [];
      }
      
      groups[dateKey][executive].push(visit);
    });

    return groups;
  }, [data]);
  
  const weeks = [];
  for (let i = 0; i < 5; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      week.push(addDays(startDay, i * 7 + j));
    }
    weeks.push(week);
  }

  const renderDayCell = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayVisitsByExecutive = groupedVisitsByDay[dayKey] || {};
    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

    return (
      <div key={day.toString()} className={cn("border rounded-lg p-2 h-64 flex flex-col", isCurrentMonth ? 'bg-card' : 'bg-muted/50')}>
        <span className={cn("font-medium", isCurrentMonth ? 'text-foreground' : 'text-muted-foreground')}>
          {format(day, 'd')}
        </span>
        <ScrollArea className="flex-1 mt-2">
          <div className="space-y-3">
            {Object.entries(dayVisitsByExecutive).map(([executive, visits]) => (
              <div key={executive}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: executiveColorMap[executive] || '#ccc' }} />
                  <p className="text-xs font-semibold truncate">{executive}</p>
                </div>
                <div className="space-y-1">
                {visits.map(visit => (
                  <Card 
                    key={visit.id} 
                    onClick={() => setSelectedVisit(visit)}
                    className="cursor-pointer hover:bg-muted transition-colors p-2 text-xs"
                    style={{ borderLeft: `3px solid ${executiveColorMap[executive] || '#ccc'}` }}
                  >
                    <p className="font-semibold truncate">{visit['ACTIVIDAD']}</p>
                    <p className="text-muted-foreground truncate">{visit['CADENA']}</p>
                  </Card>
                ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };
  
  return (
    <>
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Calendario de Actividades</CardTitle>
            <CardDescription>Vista semanal de las actividades programadas.</CardDescription>
          </div>
          <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft /></Button>
              <Select value={filters.month} onValueChange={(value) => onFilterChange('month', value)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight /></Button>
            </div>
            <Select value={filters.trade_executive} onValueChange={(v) => onFilterChange('trade_executive', v)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Ejecutiva..."/></SelectTrigger>
                <SelectContent>
                    {tradeExecutiveOptions.map(name => <SelectItem key={name} value={name}>{name === 'all' ? 'Todas las Ejecutivas' : name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.agent} onValueChange={(v) => onFilterChange('agent', v)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Asesor..."/></SelectTrigger>
                <SelectContent>
                    {agentOptions.map(name => <SelectItem key={name} value={name}>{name === 'all' ? 'Todos los Asesores' : name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-muted-foreground text-sm">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {weeks.flat().map(day => renderDayCell(day))}
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!selectedVisit} onOpenChange={(isOpen) => !isOpen && setSelectedVisit(null)}>
      <DialogContent className="sm:max-w-2xl">
        {selectedVisit && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{selectedVisit['ACTIVIDAD']}</DialogTitle>
              <DialogDescription>
                Detalles para {selectedVisit['CADENA']} el {format(new Date(selectedVisit['FECHA']), 'PPP', { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 text-sm">
              <div className="flex items-start gap-3"><User className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Ejecutiva</p><p className="font-semibold">{selectedVisit['EJECUTIVA DE TRADE']}</p></div></div>
              <div className="flex items-start gap-3"><Users2 className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Asesor</p><p className="font-semibold">{selectedVisit['ASESOR COMERCIAL']}</p></div></div>
              <div className="flex items-start gap-3"><Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Cadena</p><p className="font-semibold">{selectedVisit['CADENA']}</p></div></div>
              <div className="flex items-start gap-3"><Network className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Canal</p><p className="font-semibold">{selectedVisit['CANAL']}</p></div></div>
              <div className="flex items-start gap-3"><MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Ciudad</p><p className="font-semibold">{selectedVisit['CIUDAD']}</p></div></div>
              <div className="flex items-start gap-3"><Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Horario</p><p className="font-semibold">{selectedVisit['HORARIO']}</p></div></div>
              <div className="flex items-start gap-3"><DollarSign className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Presupuesto</p><p className="font-semibold">{selectedVisit['PRESUPUESTO']?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p></div></div>
              <div className="flex items-start gap-3"><Package className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" /><div className="space-y-1"><p className="font-medium text-muted-foreground">Muestras</p><p className="font-semibold">{selectedVisit['CANTIDAD DE MUESTRAS']?.toLocaleString('es-CO') || 'N/A'}</p></div></div>
              
              {Object.keys(selectedVisit['MATERIAL POP']).length > 0 && (
                <div className="md:col-span-2 flex items-start gap-3">
                  <Package className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 w-full">
                    <p className="font-medium text-muted-foreground">Material POP</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedVisit['MATERIAL POP']).map(([material, quantity]) => (
                            <Badge key={material} variant="secondary">{quantity} x {material}</Badge>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2 flex items-start gap-3">
                <Target className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                <div className="space-y-1 w-full">
                  <p className="font-medium text-muted-foreground">Objetivo</p>
                  <Textarea readOnly value={selectedVisit['OBJETIVO DE LA ACTIVIDAD'] || 'Sin objetivo definido.'} className="mt-1 h-auto bg-transparent"/>
                </div>
              </div>
              <div className="md:col-span-2 flex items-start gap-3">
                <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                <div className="space-y-1 w-full">
                  <p className="font-medium text-muted-foreground">Observación</p>
                  <Textarea readOnly value={selectedVisit['OBSERVACION'] || 'Sin observaciones.'} className="mt-1 h-auto bg-transparent"/>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={() => { setSelectedVisit(null); onDeleteVisit(selectedVisit); }}>
                  <Trash2 className="mr-2 h-4 w-4"/>Eliminar
              </Button>
              <Button onClick={() => { setSelectedVisit(null); onEditVisit(selectedVisit); }}>
                  <Pencil className="mr-2 h-4 w-4"/>Editar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
