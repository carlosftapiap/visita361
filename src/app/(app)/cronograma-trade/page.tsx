"use client";

import { useState } from 'react';
import { Trash2, BarChart3, Plus, Copy, Loader2 } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CronogramaTradePage() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDataProcessed = (processedData: Omit<Visit, 'id'>[]) => {
    const newDataWithIds = processedData.map((d, i) => ({
        ...d,
        id: `local-${Date.now()}-${i}`
    }));
    setData(prev => [...prev, ...newDataWithIds]);
    toast({
        title: 'Éxito',
        description: `${processedData.length} registros han sido añadidos a la memoria. Los datos se perderán al recargar.`,
    });
  };

  const handleReset = () => {
    setData([]);
    toast({
        title: "Datos Eliminados",
        description: "Toda la información ha sido borrada de la sesión actual.",
    });
  }

  const handleSaveVisit = (visitToSave: Visit) => {
    const visitExists = data.some(v => v.id === visitToSave.id);

    if (visitExists) {
        setData(prev => prev.map(v => v.id === visitToSave.id ? visitToSave : v));
        toast({ title: 'Éxito', description: 'Visita actualizada correctamente.' });
    } else {
        setData(prev => [...prev, visitToSave]);
        toast({ title: 'Éxito', description: 'Visita creada correctamente.' });
    }
    setFormState({ open: false, visit: null });
  };

  const handleEditVisit = (visit: Visit) => {
    setFormState({ open: true, visit });
  };

  const handleAddVisitClick = () => {
    setFormState({ open: true, visit: null });
  };

  const handleDuplicateMonth = (sourceMonthStr: string, targetMonthStr: string) => {
    if (!data) return;

    const [sourceYear, sourceMonthNum] = sourceMonthStr.split('-').map(Number);
    const [targetYear, targetMonthNum] = targetMonthStr.split('-').map(Number);

    const sourceVisits = data.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate.getFullYear() === sourceYear && visitDate.getMonth() + 1 === sourceMonthNum;
    });

    if (sourceVisits.length === 0) {
        toast({
            variant: "destructive",
            title: "Sin datos",
            description: "No se encontraron visitas en el mes de origen para duplicar.",
        });
        return;
    }

    const lastDayOfTargetMonth = new Date(targetYear, targetMonthNum, 0).getDate();

    const newVisits: Visit[] = sourceVisits.map((visit, i) => {
        const originalDate = new Date(visit.date);
        const dayOfMonth = originalDate.getDate();
        const dayToSet = Math.min(dayOfMonth, lastDayOfTargetMonth);
        const targetDate = new Date(targetYear, targetMonthNum - 1, dayToSet);
        const { id, ...rest } = visit;
        return {
            ...rest,
            date: targetDate,
            id: `local-dup-${Date.now()}-${i}`
        };
    });
    
    setData(prev => [...prev, ...newVisits]);
    toast({
        title: "Éxito",
        description: `${newVisits.length} visitas han sido duplicadas al nuevo mes.`,
    });
    setIsDuplicateDialogOpen(false);
  };

  const isDataReady = !loading && data.length > 0;
  const showEmptyState = !loading && data.length === 0;

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary">Cronograma Trade</h1>
                <p className="text-muted-foreground">Panel de control de actividades y visitas. Los datos son temporales.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={data.length === 0} className="flex-1 sm:flex-none">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar Mes
                </Button>
                <Button onClick={handleAddVisitClick} className="flex-1 sm:flex-none">
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Visita
                </Button>
                {isDataReady && (
                    <Button onClick={handleReset} variant="destructive" className="flex-1 sm:flex-none">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Datos
                    </Button>
                )}
            </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
            <div className="w-full lg:w-96 lg:shrink-0">
              <FileUploader onDataProcessed={handleDataProcessed} />
            </div>
            <div className="flex-1">
              {loading ? (
                 <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                    <CardContent className="flex flex-col items-center gap-4 p-6">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        <h2 className="font-headline text-2xl">Procesando...</h2>
                        <p className="max-w-xs text-muted-foreground">Cargando los datos.</p>
                    </CardContent>
                </Card>
              ) : isDataReady ? (
                <Dashboard data={data} onEditVisit={handleEditVisit} />
              ) : showEmptyState ? (
                <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                    <CardContent className="flex flex-col items-center gap-4 p-6">
                        <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                            <BarChart3 className="h-16 w-16 text-primary" />
                        </div>
                        <h2 className="font-headline text-2xl">Esperando datos</h2>
                        <p className="max-w-xs text-muted-foreground">Cargue un archivo o añada una visita para comenzar a analizar la información.</p>
                    </CardContent>
                </Card>
              ) : null}
            </div>
        </div>

        <VisitForm
            isOpen={formState.open}
            onOpenChange={(isOpen) => setFormState({ ...formState, open: isOpen, visit: isOpen ? formState.visit : null })}
            visit={formState.visit}
            onSave={handleSaveVisit}
          />
        <DuplicateMonthDialog
            isOpen={isDuplicateDialogOpen}
            onOpenChange={setIsDuplicateDialogOpen}
            onDuplicate={handleDuplicateMonth}
            data={data}
        />
    </div>
  );
}
