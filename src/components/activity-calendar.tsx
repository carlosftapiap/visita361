"use client";

import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Visit } from '@/types';

interface ActivityCalendarProps {
  data: Visit[];
  executives: string[];
  agents: string[];
  selectedExecutive: string;
  selectedAgent: string;
  onExecutiveChange: (value: string) => void;
  onAgentChange: (value: string) => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const MAX_VISIBLE_VISITS = 2;

export default function ActivityCalendar({ 
  data,
  executives,
  agents,
  selectedExecutive,
  selectedAgent,
  onExecutiveChange,
  onAgentChange
}: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ date: Date; visits: Visit[] } | null>(null);

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

  const activityColors: Record<string, string> = {
    'Visita': '--primary',
    'Impulso': '--accent',
    'Verificación': '--chart-3',
  };
  
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const formattedDateRange = `${capitalize(format(weekStart, 'd MMM', { locale: es }))} - ${capitalize(format(weekEnd, 'd MMM yyyy', { locale: es }))}`;

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
                <Select value={selectedExecutive} onValueChange={onExecutiveChange} disabled={executives.length <= 1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Ejecutiva" />
                  </SelectTrigger>
                  <SelectContent>
                    {executives.length > 1 ? executives.map(exec => (
                      <SelectItem key={exec} value={exec}>{exec === 'all' ? 'Todas las Ejecutivas' : exec}</SelectItem>
                    )) : <SelectItem value="all" disabled>No hay ejecutivas</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
               <div className="w-full sm:w-52">
                <Select value={selectedAgent} onValueChange={onAgentChange} disabled={agents.length <= 1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Asesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.length > 1 ? agents.map(agent => (
                      <SelectItem key={agent} value={agent}>{agent === 'all' ? 'Todos los Asesores' : agent}</SelectItem>
                    )) : <SelectItem value="all" disabled>No hay asesores</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {weekDays.map(day => {
              const dayVisits = data.filter(visit => isSameDay(visit.date, day));
              return (
                <div key={day.toISOString()} className="flex min-h-48 flex-col rounded-lg border bg-background p-2">
                  <div className="text-center text-sm font-semibold">{capitalize(format(day, 'eee', { locale: es }))}</div>
                  <div className="text-center text-xs text-muted-foreground">{format(day, 'd')}</div>
                  <div className="mt-2 flex-grow space-y-1.5">
                    {dayVisits.slice(0, MAX_VISIBLE_VISITS).map(visit => (
                      <div
                        key={visit.id}
                        className="cursor-pointer rounded-md bg-card p-2 text-xs shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary"
                        style={{ borderLeft: `4px solid hsl(var(${activityColors[visit.activity] || '--muted'}))` }}
                        onClick={() => setSelectedDay({ date: day, visits: dayVisits })}
                      >
                         <p className="font-semibold text-card-foreground">{visit.activity}</p>
                         <p className="truncate text-muted-foreground">{visit.agent}</p>
                         <p className="truncate text-muted-foreground">{visit.chain}</p>
                      </div>
                    ))}
                    {dayVisits.length > MAX_VISIBLE_VISITS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-full p-2 text-center text-xs text-primary"
                        onClick={() => setSelectedDay({ date: day, visits: dayVisits })}
                      >
                        + {dayVisits.length - MAX_VISIBLE_VISITS} más...
                      </Button>
                    )}
                    {dayVisits.length === 0 && (
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

      <Dialog open={!!selectedDay} onOpenChange={(isOpen) => !isOpen && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Actividades del {selectedDay ? capitalize(format(selectedDay.date, "eeee d 'de' MMMM", { locale: es })) : ''}
            </DialogTitle>
            <DialogDescription>
              Lista completa de actividades programadas para este día.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 pr-6">
            <div className="space-y-3 py-4">
              {selectedDay?.visits.map(visit => (
                <div
                  key={visit.id}
                  className="rounded-lg border bg-card p-3 text-sm"
                  style={{ borderLeft: `4px solid hsl(var(${activityColors[visit.activity] || '--muted'}))` }}
                >
                  <p className="font-bold text-card-foreground">{visit.activity}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Asesor:</span> {visit.agent}</p>
                    <p><span className="font-semibold text-foreground">Ejecutiva:</span> {visit.trade_executive}</p>
                    <p><span className="font-semibold text-foreground">Cadena:</span> {visit.chain} ({visit.pdv_detail})</p>
                    <p><span className="font-semibold text-foreground">Horario:</span> {visit.schedule}</p>
                    {visit.budget > 0 && (
                        <p><span className="font-semibold text-foreground">Presupuesto:</span> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(visit.budget)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
