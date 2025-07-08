"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, BarChart3, Plus, Copy, Loader2 } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simula la carga inicial de la página
    setLoading(false);
  }, []);

  const handleDataProcessed = (processedData: Visit[]) => {
    setData(prevData => [...prevData, ...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({
        title: 'Éxito',
        description: `${processedData.length} registros han sido añadidos.`,
    });
  };

  const handleReset = () => {
    setData([]);
    toast({
        title: "Datos Eliminados",
        description: "Toda la información ha sido borrada.",
    });
  }

  const handleSaveVisit = (visitToSave: Visit) => {
    setData(currentData => {
      const isNew = !currentData.some(d => d.id === visitToSave.id);
      let newData;
      if (isNew) {
        newData = [...currentData, visitToSave];
        toast({ title: 'Éxito', description: `Visita creada correctamente.` });
      } else {
        newData = currentData.map(d => d.id === visitToSave.id ? visitToSave : d);
        toast({ title: 'Éxito', description: `Visita actualizada correctamente.` });
      }
      return newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
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

    const newVisits = sourceVisits.map((visit, index) => {
        const originalDate = new Date(visit.date);
        const dayOfMonth = originalDate.getDate();
        const dayToSet = Math.min(dayOfMonth, lastDayOfTargetMonth);
        const targetDate = new Date(targetYear, targetMonthNum - 1, dayToSet);
        const { id, ...rest } = visit;
        return {
            ...rest,
            id: `manual-duplicated-${Date.now()}-${index}`,
            date: targetDate,
        };
    });
    
    setData(prevData => [...prevData, ...newVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    toast({
        title: "Éxito",
        description: `${newVisits.length} visitas han sido duplicadas al nuevo mes.`,
    });
    setIsDuplicateDialogOpen(false);
  };

  const isDataReady = !loading && data.length > 0;
  const showEmptyState = !loading && data.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M4 4.00098H12.001L12.002 12.002L4 12.001L4 4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16.002H8.0005L8.001 20.0024H4V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.002 16.002H20.003L20.002 20.0024H12.002V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.002 4.00098H20.0024V8.00149H16.002V4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="font-headline text-2xl font-bold text-primary md:text-3xl">
            Visita360
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={data.length === 0}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar Mes
            </Button>
            <Button onClick={handleAddVisitClick}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Visita
            </Button>
            {isDataReady && (
                <Button onClick={handleReset} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Datos
                </Button>
            )}
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4 md:p-6 lg:flex-row">
        <div className="w-full lg:w-96 lg:shrink-0">
          <FileUploader onDataProcessed={handleDataProcessed} />
        </div>
        <div className="flex-1">
          {loading ? (
             <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <h2 className="font-headline text-2xl">Cargando Panel...</h2>
                    <p className="max-w-xs text-muted-foreground">Preparando todo para empezar.</p>
                </CardContent>
            </Card>
          ) : isDataReady ? (
            <Dashboard data={data} onEditVisit={handleEditVisit} />
          ) : (
            <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                        <BarChart3 className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-headline text-2xl">Esperando datos</h2>
                    <p className="max-w-xs text-muted-foreground">Cargue un archivo o añada una visita para comenzar a analizar la información.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
      
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
