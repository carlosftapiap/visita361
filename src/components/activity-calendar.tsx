
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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

const executivePhotoMap: Record<string, string> = {
    'Luisa Perez': 'https://placehold.co/40x40.png',
    'CAROLINA CAICEDO': 'https://placehold.co/40x40.png',
    'JOHANA CORTES': 'https://placehold.co/40x40.png',
    'KATHERINE PARRA': 'https://placehold.co/40x40.png',
    'DEFAULT': 'https://placehold.co/40x40.png',
};

const getExecutivePhoto = (name: string) => {
    return executivePhotoMap[name] || executivePhotoMap['DEFAULT'];
}

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
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    data.forEach(visit => {
      monthSet.add(format(new Date(visit['FECHA']), 'yyyy-MM'));
    });
    
    // Also add the next 12 months from today, and past 3 months to ensure navigation is possible
    const today = new Date();
    for (let i = -3; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        monthSet.add(format(date, 'yyyy-MM'));
    }

    const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
    return sortedMonths.map(key => ({
      value: key,
      label: capitalize(format(new Date(key + '-02'), 'MMMM yyyy', { locale: es })),
    }));
  }, [data]);
  
  const handleMonthChange = (monthStr: string) => {
    if (monthStr) {
      setSelectedMonth(monthStr);
      // Set calendar to the first day of the selected month
      const [year, month] = monthStr.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  // Sync selectedMonth with currentDate when navigating with arrows
  useEffect(() => {
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    if (selectedMonth !== currentMonthStr) {
      if (availableMonths.some(m => m.value === currentMonthStr)) {
        setSelectedMonth(currentMonthStr);
      }
    }
  }, [currentDate, selectedMonth, availableMonths]);

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
    'Visita': 'hsl(var(--primary))',
    'IMPULSACIÓN': 'hsl(var(--accent))',
    'Verificación': 'hsl(var(--chart-3))',
    'Libre': 'hsl(var(--secondary))',
  };
  
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
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                      <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Mes" />
                      </SelectTrigger>
                      <SelectContent>
                          {availableMonths.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
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
          <div className="grid grid-cols-1 gap-px md:grid-cols-7 border rounded-lg overflow-hidden">
            <div className="hidden md:grid md:grid-cols-7 md:col-span-7">
              {weekDays.map(day => (
                <div key={`header-${day.toISOString()}`} className="text-center py-2 bg-muted text-sm font-semibold">{capitalize(format(day, 'eee d', { locale: es }))}</div>
              ))}
            </div>
            {weekDays.map(day => {
              const dayVisits = data.filter(visit => isSameDay(new Date(visit['FECHA']), day));
              return (
                <div key={day.toISOString()} className={cn("flex min-h-[16rem] flex-col bg-background p-2 border-t md:border-t-0 md:border-l")}>
                   <div className="text-center text-sm font-semibold md:hidden">{capitalize(format(day, 'eee d', { locale: es }))}</div>
                   <ScrollArea className="flex-grow mt-2">
                    <div className="space-y-1.5 pr-2">
                      {dayVisits.length > 0 ? (
                        dayVisits.map(visit => (
                          <div
                            key={visit.id}
                            onClick={() => setSelectedVisit(visit)}
                            className="rounded-md bg-card p-2 text-xs shadow-sm cursor-pointer transition-colors hover:bg-muted/50"
                            style={{ borderLeft: `4px solid ${activityColors[visit['ACTIVIDAD']] || 'hsl(var(--muted))'}` }}
                          >
                             <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={getExecutivePhoto(visit['EJECUTIVA DE TRADE'])} alt={visit['EJECUTIVA DE TRADE']} data-ai-hint="woman portrait" />
                                    <AvatarFallback>{visit['EJECUTIVA DE TRADE']?.charAt(0) ?? 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-semibold text-card-foreground">{visit['ACTIVIDAD']}</p>
                                    <p className="truncate text-muted-foreground">{visit['EJECUTIVA DE TRADE']}</p>
                                    <p className="truncate text-muted-foreground">{visit['CADENA']}</p>
                                </div>
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

    
