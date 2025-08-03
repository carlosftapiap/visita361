
"use client";

import { useMemo, useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Visit } from '@/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


interface ActivityCalendarProps {
  data: Visit[];
  allVisits: Visit[];
  filters: { month: string; trade_executive: string; agent: string };
  onFilterChange: (filterName: keyof ActivityCalendarProps['filters'], value: string) => void;
  onEditVisit: (visit: Visit) => void;
  isAdmin: boolean;
}

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

type GroupedVisits = {
  [key: string]: { [executive: string]: Visit[] };
};

export default function ActivityCalendar({ data, allVisits, filters, onFilterChange, onEditVisit, isAdmin }: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // When the global month filter changes, reset the calendar to the start of that month.
    const newDate = new Date(filters.month + '-02T12:00:00Z');
    setCurrentDate(newDate);
  }, [filters.month]);

  const { weekDays, weekLabel, allExecutives, allAgents } = useMemo(() => {
    const weekStartsOn = 1; // Monday
    const firstDay = startOfWeek(currentDate, { weekStartsOn });
    const lastDay = endOfWeek(currentDate, { weekStartsOn });
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    const startLabel = format(firstDay, 'd MMM', { locale: es });
    const endLabel = format(lastDay, 'd MMM yyyy', { locale: es });
    
    const execSet = new Set<string>();
    const agentSet = new Set<string>();
    allVisits.forEach(v => {
      if(v['EJECUTIVA DE TRADE']) execSet.add(v['EJECUTIVA DE TRADE']);
      if(v['ASESOR COMERCIAL']) agentSet.add(v['ASESOR COMERCIAL']);
    });
    
    return {
      weekDays: days,
      weekLabel: `Semana del ${startLabel} al ${endLabel}`,
      allExecutives: ['all', ...Array.from(execSet).sort()],
      allAgents: ['all', ...Array.from(agentSet).sort()],
    };
  }, [currentDate, allVisits]);

  const groupedVisitsByDay = useMemo(() => {
    const grouped: GroupedVisits = {};
    data.forEach(visit => {
      // IMPORTANT: Normalize dates to UTC to avoid timezone issues.
      const visitDate = parseISO(visit.FECHA);
      const zonedDate = toZonedTime(visitDate, 'UTC'); // Treat date as UTC
      const dayKey = format(zonedDate, 'yyyy-MM-dd');
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = {};
      }
      const executive = visit['EJECUTIVA DE TRADE'] || 'Sin Asignar';
      if (!grouped[dayKey][executive]) {
        grouped[dayKey][executive] = [];
      }
      grouped[dayKey][executive].push(visit);
    });
    return grouped;
  }, [data]);

  const handleWeekChange = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    // Also update the global month filter if the week crosses into a new month
    if (format(newDate, 'yyyy-MM') !== filters.month) {
        onFilterChange('month', format(newDate, 'yyyy-MM'));
    }
  };

  const getDayKey = (day: Date) => {
    return format(day, 'yyyy-MM-dd');
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-xl">Calendario Semanal de Actividades</CardTitle>
                <CardDescription>{weekLabel}</CardDescription>
            </div>
            <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                 <Select value={filters.trade_executive} onValueChange={(val) => onFilterChange('trade_executive', val)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por ejecutiva..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allExecutives.map(e => <SelectItem key={e} value={e}>{e === 'all' ? 'Todas las Ejecutivas' : e}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.agent} onValueChange={(val) => onFilterChange('agent', val)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por asesor..." />
                    </SelectTrigger>
                    <SelectContent>
                         {allAgents.map(a => <SelectItem key={a} value={a}>{a === 'all' ? 'Todos los Asesores' : a}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-t border-l">
          {weekDays.map((day) => (
            <div key={day.toString()} className="p-2 text-center font-bold text-sm border-b border-r bg-muted/50">
              <span className="hidden sm:inline">{capitalize(format(day, 'E', { locale: es }))}</span> {format(day, 'd')}
            </div>
          ))}
          {weekDays.map((day) => {
            const dayKey = getDayKey(day);
            const visitsForDay = groupedVisitsByDay[dayKey];

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative h-[768px] border-b border-r p-1",
                   isSameDay(day, new Date()) && "bg-accent/10"
                )}
              >
                <ScrollArea className="h-full w-full">
                  <div className="flex flex-col gap-2 p-1">
                    {visitsForDay && Object.entries(visitsForDay).map(([executive, visits]) => (
                      <Collapsible key={executive} className="w-full">
                         <CollapsibleTrigger asChild>
                           <button className="flex items-center gap-2 mb-1 w-full text-left p-1 rounded-md hover:bg-accent/50 transition-colors">
                             <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: stringToColor(executive) }} />
                             <p className="text-xs font-semibold truncate">{executive}</p>
                           </button>
                         </CollapsibleTrigger>
                         <CollapsibleContent>
                           <div className="flex flex-col gap-1 pl-1">
                             {visits.map(visit => (
                               <button
                                 key={visit.id}
                                 onClick={() => onEditVisit(visit)}
                                 className="relative w-full cursor-pointer rounded-md p-1.5 text-left text-xs transition-colors hover:bg-accent/80 border-l-4"
                                 style={{ borderColor: stringToColor(executive) }}
                               >
                                 <p className="font-medium truncate">{visit['ACTIVIDAD']}</p>
                                 <p className="text-muted-foreground truncate">{visit['CADENA']}</p>
                               </button>
                             ))}
                           </div>
                         </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
