
"use client";

import { useMemo, useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { Visit } from '@/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';

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
  const [currentDate, setCurrentDate] = useState(new Date(filters.month + '-02'));
  
  useEffect(() => {
    setCurrentDate(new Date(filters.month + '-02'));
  }, [filters.month]);

  const { monthDays, monthLabel, allExecutives, allAgents } = useMemo(() => {
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);
    
    // Start week on Monday (locale-aware)
    const weekStartsOn = 1;
    const monthStart = startOfWeek(firstDay, { weekStartsOn });
    const monthEnd = startOfWeek(addMonths(lastDay, 1), { weekStartsOn });
    
    const days = eachDayOfInterval({ start: monthStart, end: addMonths(monthEnd, -1) });
    const daysInGrid = days.slice(0, 42);

    const execSet = new Set<string>();
    const agentSet = new Set<string>();
    allVisits.forEach(v => {
      if(v['EJECUTIVA DE TRADE']) execSet.add(v['EJECUTIVA DE TRADE']);
      if(v['ASESOR COMERCIAL']) agentSet.add(v['ASESOR COMERCIAL']);
    });
    
    return {
      monthDays: daysInGrid,
      monthLabel: capitalize(format(currentDate, 'MMMM yyyy', { locale: es })),
      allExecutives: ['all', ...Array.from(execSet).sort()],
      allAgents: ['all', ...Array.from(agentSet).sort()],
    };
  }, [currentDate, allVisits]);

  const groupedVisitsByDay = useMemo(() => {
    const grouped: GroupedVisits = {};
    data.forEach(visit => {
      const visitDate = new Date(visit.FECHA);
      const dayKey = format(visitDate, 'yyyy-MM-dd');

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

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    onFilterChange('month', format(newDate, 'yyyy-MM'));
  };

  const getDayKey = (day: Date) => format(day, 'yyyy-MM-dd');

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-xl">Calendario de Actividades</CardTitle>
                <CardDescription>Vista mensual de las actividades programadas.</CardDescription>
            </div>
            <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="w-32 text-center font-semibold">{monthLabel}</span>
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
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
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="p-2 text-center font-bold text-sm border-b border-r bg-muted/50">
              {day}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayKey = getDayKey(day);
            const visitsForDay = groupedVisitsByDay[dayKey];
            const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM');

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative h-64 border-b border-r p-2",
                  !isCurrentMonth && 'bg-muted/30 text-muted-foreground'
                )}
              >
                <span className={cn("font-semibold", isSameDay(day, new Date()) && "text-primary font-bold")}>
                  {format(day, 'd')}
                </span>
                {visitsForDay && (
                  <ScrollArea className="absolute top-8 bottom-2 left-2 right-2">
                    <div className="flex flex-col gap-2 pr-2">
                      {Object.entries(visitsForDay).map(([executive, visits]) => (
                        <div key={executive}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: stringToColor(executive) }} />
                            <p className="text-xs font-semibold truncate">{executive}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {visits.map(visit => (
                              <button
                                key={visit.id}
                                onClick={() => onEditVisit(visit)}
                                className={cn(
                                    "relative w-full cursor-pointer rounded-md p-1.5 text-left text-xs transition-colors hover:bg-accent",
                                    "border-l-4"
                                )}
                                style={{ borderColor: stringToColor(executive) }}
                              >
                                <p className="font-medium truncate">{visit['ACTIVIDAD']}</p>
                                <p className="text-muted-foreground truncate">{visit['CADENA']}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

    