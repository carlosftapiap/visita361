"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Visit } from '@/types';

interface ActivityCalendarProps {
  data: Visit[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ActivityCalendar({ data }: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const agents = useMemo(() => Array.from(new Set(data.map(visit => visit.agent))), [data]);
  const [selectedAgent, setSelectedAgent] = useState(agents[0] || '');

  useEffect(() => {
    // When data is loaded or filtered, if the selected agent is no longer valid,
    // reset to the first available agent or empty.
    if (!agents.includes(selectedAgent)) {
        setSelectedAgent(agents[0] || '');
    }
  }, [agents, selectedAgent]);

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

  const agentVisits = useMemo(() => {
    return data.filter(visit => visit.agent === selectedAgent);
  }, [data, selectedAgent]);

  const activityColors: Record<string, string> = {
    'Visita': '--primary',
    'Impulso': '--accent',
    'Verificación': '--chart-3',
  };
  
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const formattedDateRange = `${capitalize(format(weekStart, 'd MMM', { locale: es }))} - ${capitalize(format(weekEnd, 'd MMM yyyy', { locale: es }))}`;

  return (
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
              <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={agents.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.length > 0 ? agents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  )) : <SelectItem value="" disabled>No hay agentes</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {weekDays.map(day => {
            const dayVisits = agentVisits.filter(visit => isSameDay(visit.date, day));
            return (
              <div key={day.toISOString()} className="flex min-h-36 flex-col rounded-lg border bg-background p-2">
                <div className="text-center text-sm font-semibold">{capitalize(format(day, 'eee', { locale: es }))}</div>
                <div className="text-center text-xs text-muted-foreground">{format(day, 'd')}</div>
                <div className="mt-2 flex-grow space-y-1.5">
                  {dayVisits.length > 0 ? dayVisits.map(visit => (
                    <div
                      key={visit.id}
                      className="cursor-pointer rounded-md bg-card p-2 text-xs shadow-sm"
                      style={{ borderLeft: `4px solid hsl(var(${activityColors[visit.activity] || '--muted'}))` }}
                    >
                       <p className="font-semibold text-card-foreground">{visit.activity}</p>
                       <p className="truncate text-muted-foreground">{visit.client}</p>
                    </div>
                  )) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground/50">
                      -
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
}
