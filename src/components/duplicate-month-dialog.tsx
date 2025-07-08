"use client";

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Visit } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DuplicateMonthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDuplicate: (sourceDateStr: string, targetDateStr: string) => void;
  data: Visit[] | null;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DuplicateMonthDialog({ isOpen, onOpenChange, onDuplicate, data }: DuplicateMonthDialogProps) {
  const [sourceMonth, setSourceMonth] = useState<string | undefined>();
  const [targetMonth, setTargetMonth] = useState<string | undefined>();

  const availableMonths = useMemo(() => {
    if (!data) return [];
    const monthSet = new Set<string>();
    data.forEach(visit => {
      const monthYearKey = format(visit.date, 'yyyy-MM');
      monthSet.add(monthYearKey);
    });
    const sortedMonths = Array.from(monthSet).sort().reverse();
    return sortedMonths.map(key => ({
      value: key,
      label: capitalize(format(new Date(key + '-02'), 'MMMM yyyy', { locale: es })),
    }));
  }, [data]);

  const targetMonthsOptions = useMemo(() => {
    const allMonths = new Set<string>();
    
    // Add all existing months from data
    if (data) {
        data.forEach(visit => {
            allMonths.add(format(visit.date, 'yyyy-MM'));
        });
    }

    // Determine the starting point for future months
    let lastDateInState;
    if (data && data.length > 0) {
        lastDateInState = data.reduce((latest, visit) => (new Date(visit.date) > new Date(latest.date) ? visit : latest)).date;
    } else {
        lastDateInState = new Date(); // Default to current date if no data
    }
    
    let currentDate = new Date(lastDateInState);

    // Add the next 12 months
    for (let i = 1; i <= 12; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        allMonths.add(format(currentDate, 'yyyy-MM'));
    }

    const sortedMonths = Array.from(allMonths).sort().reverse();
     return sortedMonths.map(key => ({
      value: key,
      label: capitalize(format(new Date(key + '-02'), 'MMMM yyyy', { locale: es })),
    }));

  }, [data]);


  const handleDuplicateClick = () => {
    if (sourceMonth && targetMonth) {
      onDuplicate(sourceMonth, targetMonth);
      onOpenChange(false);
      setSourceMonth(undefined);
      setTargetMonth(undefined);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Visitas de un Mes</DialogTitle>
          <DialogDescription>
            Seleccione un mes de origen para copiar todas sus visitas a un mes de destino. Las fechas se ajustarán manteniendo el mismo día.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-month" className="text-right">
              Mes Origen
            </Label>
            <Select value={sourceMonth} onValueChange={setSourceMonth}>
                <SelectTrigger id="source-month" className="col-span-3">
                    <SelectValue placeholder="Seleccionar mes..." />
                </SelectTrigger>
                <SelectContent>
                    {availableMonths.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-month" className="text-right">
              Mes Destino
            </Label>
            <Select value={targetMonth} onValueChange={setTargetMonth}>
                <SelectTrigger id="target-month" className="col-span-3">
                    <SelectValue placeholder="Seleccionar mes..." />
                </SelectTrigger>
                <SelectContent>
                     {targetMonthsOptions.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleDuplicateClick} disabled={!sourceMonth || !targetMonth || sourceMonth === targetMonth}>
            Duplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
