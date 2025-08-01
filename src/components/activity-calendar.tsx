
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, Building2, Network, Clock, MapPin, DollarSign, Users2, Calendar, Edit, Info, Package, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Visit } from '@/types';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

interface ActivityCalendarProps {
  data: Visit[];
  allVisits: Visit[];
  filters: {
      month: string;
      trade_executive: string;
      agent: string;
  };
  onFilterChange: (filterName: keyof ActivityCalendarProps['filters'], value: string) => void;
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
  onFilterChange
}: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const executiveColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const allExecutives = [...new Set(data.map(d => d['EJECUTIVA DE TRADE']))];
    allExecutives.forEach((exec, index) => {
      map[exec] = chartColors[index % chartColors.length];
    });
    return map;
  }, [data]);
  
  const filterOptions = useMemo(() => {
    const getUniqueNonEmpty = (items: (string | null | undefined)[]) => 
        ['all', ...[...new Set(items.filter((item): item is string => !!item && item.trim() !== ''))].sort()];

    const monthSet = new Set<string>();
    allVisits.forEach(visit => {
        monthSet.add(format(new Date(visit['FECHA']), 'yyyy-MM'));
    });
     const today = new Date();
    for (let i = -6; i <= 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        monthSet.add(format(date, 'yyyy-MM'));
    }

    const months = Array.from(monthSet).sort((a,b) => b.localeCompare(a)).map(m => ({
        value: m,
        label: capitalize(format(startOfMonth(new Date(m + '-02')), 'MMMM yyyy', { locale: es }))
    }));

    const trade_executives = getUniqueNonEmpty(allVisits.map(v => v['EJECUTIVA DE TRADE']));
    
    const relevantAgentsData = filters.trade_executive === 'all'
        ? allVisits
        : allVisits.filter(v => v['EJECUTIVA DE TRADE'] === filters.trade_executive);
    const agents = getUniqueNonEmpty(relevantAgentsData.map(v => v['ASESOR COMERCIAL']));
    
    return { months, trade_executives, agents };
  }, [allVisits, filters.trade_executive]);

  const handleMonthChange = (monthStr: string) => {
    if (monthStr) {
      onFilterChange('month', monthStr);
      const [year, month] = monthStr.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  useEffect(() => {
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    if (filters.month !== currentMonthStr) {
      if (filterOptions.months.some(m => m.value === currentMonthStr)) {
        onFilterChange('month', currentMonthStr);
      }
    }
  }, [currentDate, filters.month, onFilterChange, filterOptions.months]);

  const handlePrevWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const formattedDateRange = `${capitalize(format(weekStart, 'd MMM', { locale: es }))} - ${capitalize(format(weekEnd, 'd MMM yyyy', { locale: es }))}`;

  const formatMaterialPop = (materials?: Record<string, number>): string => {
    if (!materials || Object.keys(materials).length === 0) {
        return 'N/A';
    }
    return Object.entries(materials)
        .map(([key, value]) => `${key} (${value})`)
        .join(', ');
  };
  
  const groupedVisitsByDay = useMemo(() => {
    const grouped: Record<string, Record<string, Visit[]>> = {};
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayVisits = data.filter(visit => {
          if (!visit.FECHA) return false;
          // CORRECTED: Force both dates to be treated as UTC to prevent timezone shifts
          const visitDate = new Date(visit.FECHA);
          const visitDateInUTC = new Date(visitDate.getUTCFullYear(), visitDate.getUTCMonth(), visitDate.getUTCDate());
          const dayInUTC = new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
          return isSameDay(visitDateInUTC, dayInUTC);
      });
      
      const visitsByExecutive: Record<string, Visit[]> = {};
      dayVisits.forEach(visit => {
        const executive = visit['EJECUTIVA DE TRADE'] || 'Sin Asignar';
        if (!visitsByExecutive[executive]) {
          visitsByExecutive[executive] = [];
        }
        visitsByExecutive[executive].push(visit);
      });
      
      grouped[dayKey] = visitsByExecutive;
    });
    return grouped;
  }, [data, weekDays]);

  return (
    <>
      <Card className="h-full shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-headline text-xl">Calendario Semanal de Actividades</CardTitle>
              <CardDescription>Semana del {formattedDateRange}</CardDescription>
            </div>
            <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevWeek} aria-label="Semana anterior">
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextWeek} aria-label="Semana siguiente">
                      <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
              <div className="w-full sm:w-52">
                  <Select value={filters.month} onValueChange={handleMonthChange}>
                      <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Mes" />
                      </SelectTrigger>
                      <SelectContent>
                          {filterOptions.months.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="w-full sm:w-52">
                <Select value={filters.trade_executive} onValueChange={(value) => onFilterChange('trade_executive', value)} disabled={filterOptions.trade_executives.length <= 1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Ejecutiva" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.trade_executives.length > 1 ? filterOptions.trade_executives.map(exec => (
                      <SelectItem key={exec} value={exec}>{exec === 'all' ? 'Todas las Ejecutivas' : exec}</SelectItem>
                    )) : <SelectItem value="all" disabled>No hay ejecutivas</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
               <div className="w-full sm:w-52">
                <Select value={filters.agent} onValueChange={(value) => onFilterChange('agent', value)} disabled={filterOptions.agents.length <= 1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Asesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.agents.length > 1 ? filterOptions.agents.map(agent => (
                      <SelectItem key={agent} value={agent}>{agent === 'all' ? 'Todos los Asesores' : agent}</SelectItem>
                    )) : <SelectItem value="all" disabled>No hay asesores</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-px md:grid-cols-7 border rounded-lg overflow-hidden">
            <div className="hidden md:grid md:grid-cols-7 md:col-span-7">
              {weekDays.map(day => (
                <div key={`header-${day.toISOString()}`} className="text-center py-2 bg-muted text-sm font-semibold">{capitalize(format(day, 'eee d', { locale: es }))}</div>
              ))}
            </div>
            {weekDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayVisitsByExecutive = groupedVisitsByDay[dayKey] || {};
              const executiveNames = Object.keys(dayVisitsByExecutive).sort();

              return (
                <div key={day.toISOString()} className={cn("flex min-h-[16rem] flex-col bg-background p-2 border-t md:border-t-0 md:border-l")}>
                   <div className="text-center text-sm font-semibold md:hidden">{capitalize(format(day, 'eee d', { locale: es }))}</div>
                   <ScrollArea className="flex-grow mt-2">
                    <div className="space-y-3 pr-2">
                      {executiveNames.length > 0 ? (
                        executiveNames.map(executive => (
                          <div key={executive} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                               <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: executiveColorMap[executive] || 'hsl(var(--muted))' }}
                               />
                               <h4 className="text-xs font-semibold text-muted-foreground">{executive}</h4>
                            </div>
                            <div className="space-y-1.5 pl-4">
                               {dayVisitsByExecutive[executive].map(visit => (
                                <div
                                    key={visit.id}
                                    onClick={() => setSelectedVisit(visit)}
                                    className="rounded-md bg-card p-2 text-xs shadow-sm cursor-pointer transition-colors hover:bg-muted/50 border-l-2"
                                    style={{ borderColor: executiveColorMap[executive] || 'hsl(var(--muted))' }}
                                >
                                    <p className="font-semibold text-card-foreground">{visit['ACTIVIDAD']}</p>
                                    <p className="truncate text-muted-foreground font-medium">{visit['CADENA']}</p>
                                </div>
                               ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground/50">
                          -
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVisit} onOpenChange={(isOpen) => !isOpen && setSelectedVisit(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{selectedVisit?.['ACTIVIDAD']}</DialogTitle>
            <DialogDescription>
              {selectedVisit && capitalize(format(new Date(selectedVisit['FECHA']), "eeee, d 'de' MMMM, yyyy", { locale: es }))}
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Ejecutiva</p><p className="font-semibold text-card-foreground">{selectedVisit['EJECUTIVA DE TRADE']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Asesor</p><p className="font-semibold text-card-foreground">{selectedVisit['ASESOR COMERCIAL']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Horario</p><p className="font-semibold text-card-foreground">{selectedVisit['HORARIO']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Network className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Canal</p><p className="font-semibold text-card-foreground">{selectedVisit['CANAL']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Cadena</p><p className="font-semibold text-card-foreground">{selectedVisit['CADENA']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Dirección PDV</p><p className="font-semibold text-card-foreground">{selectedVisit['DIRECCIÓN DEL PDV']}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Ciudad</p><p className="font-semibold text-card-foreground">{selectedVisit['CIUDAD']}</p></div>
                </div>
                 <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Zona</p><p className="font-semibold text-card-foreground">{selectedVisit['ZONA']}</p></div>
                </div>
                 <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Presupuesto</p><p className="font-semibold text-card-foreground">{selectedVisit['PRESUPUESTO'] ? selectedVisit['PRESUPUESTO'].toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }) : 'N/A'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Users2 className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Afluencia Esperada</p><p className="font-semibold text-card-foreground">{selectedVisit['AFLUENCIA ESPERADA']?.toLocaleString('es-CO') || 'N/A'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Entrega Material</p><p className="font-semibold text-card-foreground">{selectedVisit['FECHA DE ENTREGA DE MATERIAL'] ? capitalize(format(new Date(selectedVisit['FECHA DE ENTREGA DE MATERIAL']), "d MMM, yyyy", { locale: es })) : 'N/A'}</p></div>
                </div>
                 <div className="flex items-start gap-3">
                    <Edit className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1"><p className="font-medium text-muted-foreground">Muestras</p><p className="font-semibold text-card-foreground">{selectedVisit['CANTIDAD DE MUESTRAS']?.toLocaleString('es-CO') || 'N/A'}</p></div>
                </div>
                 <div className="flex items-start gap-3 md:col-span-3">
                    <Package className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 w-full"><p className="font-medium text-muted-foreground">Material POP</p><p className="font-semibold text-card-foreground">{formatMaterialPop(selectedVisit['MATERIAL POP'])}</p></div>
                </div>
                 <div className="flex items-start gap-3 md:col-span-3">
                    <Target className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 w-full"><p className="font-medium text-muted-foreground">Objetivo de la Actividad</p><Textarea readOnly value={selectedVisit['OBJETIVO DE LA ACTIVIDAD'] || 'N/A'} className="mt-1 h-auto bg-transparent" /></div>
                </div>
                <div className="flex items-start gap-3 md:col-span-3">
                    <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 w-full"><p className="font-medium text-muted-foreground">Observación</p><Textarea readOnly value={selectedVisit['OBSERVACION'] || 'N/A'} className="mt-1 h-auto bg-transparent" /></div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


