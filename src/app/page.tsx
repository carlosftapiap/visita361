"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, BarChart3, Plus, Copy, Loader2 } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  getVisits,
  addVisit,
  updateVisit,
  addBatchVisits,
  deleteAllVisits,
} from '@/services/visitService';

export default function Home() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();

  const refetchData = useCallback(async () => {
    setLoading(true);
    try {
      const visits = await getVisits();
      setData(visits);
    } catch (error) {
      console.error("Error refetching data:", error);
      toast({
        variant: "destructive",
        title: "Error de Sincronización",
        description: "No se pudieron actualizar los datos desde la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  const handleDataProcessed = async (processedData: Visit[]) => {
    setLoading(true);
    const visitsToAdd = processedData.map(({ id, ...rest }) => rest);
    await addBatchVisits(visitsToAdd as Omit<Visit, 'id'>[]);
    await refetchData();
     toast({
        title: 'Éxito',
        description: `${visitsToAdd.length} registros han sido añadidos a la base de datos.`,
    });
  };

  const handleReset = async () => {
    setLoading(true);
    try {
        await deleteAllVisits();
        setData([]);
        toast({
            title: "Datos Eliminados",
            description: "Toda la información ha sido borrada de la base de datos.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error al Eliminar",
            description: "No se pudieron borrar los datos de la base de datos.",
        });
    } finally {
        setLoading(false);
    }
  }

  const handleSaveVisit = async (visitToSave: Visit) => {
    setLoading(true);
    const isNew = !data.some(d => d.id === visitToSave.id);
    const { id, ...dataToSave } = visitToSave;

    try {
        if (isNew) {
            await addVisit(dataToSave as Omit<Visit, 'id'>);
        } else {
            await updateVisit(id, dataToSave);
        }
        await refetchData();
        toast({
            title: 'Éxito',
            description: `Visita ${isNew ? 'creada' : 'actualizada'} correctamente.`,
        });
        setFormState({ open: false, visit: null });
    } catch (error) {
        console.error("Error saving visit:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudo guardar la visita en la base de datos.',
        });
        setLoading(false);
    }
  };

  const handleEditVisit = (visit: Visit) => {
    setFormState({ open: true, visit });
  };

  const handleAddVisitClick = () => {
    setFormState({ open: true, visit: null });
  };

  const handleDuplicateMonth = async (sourceMonthStr: string, targetMonthStr: string) => {
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

    const newVisits = sourceVisits.map(visit => {
        const originalDate = new Date(visit.date);
        const dayOfMonth = originalDate.getDate();
        const dayToSet = Math.min(dayOfMonth, lastDayOfTargetMonth);
        const targetDate = new Date(targetYear, targetMonthNum - 1, dayToSet);
        const { id, ...rest } = visit;
        return {
            ...rest,
            date: targetDate,
        };
    });
    
    setLoading(true);
    await addBatchVisits(newVisits as Omit<Visit, 'id'>[]);
    await refetchData();

    toast({
        title: "Éxito",
        description: `${newVisits.length} visitas han sido duplicadas al nuevo mes.`,
    });
    setIsDuplicateDialogOpen(false);
  };


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
            <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={loading || data.length === 0}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar Mes
            </Button>
            <Button onClick={handleAddVisitClick} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Visita
            </Button>
            {data && data.length > 0 && (
                <Button onClick={handleReset} variant="destructive" disabled={loading}>
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
                    <h2 className="font-headline text-2xl">Cargando Datos...</h2>
                    <p className="max-w-xs text-muted-foreground">Estableciendo conexión con la base de datos.</p>
                </CardContent>
            </Card>
          ) : data && data.length > 0 ? (
            <Dashboard data={data} onEditVisit={handleEditVisit} />
          ) : (
            <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                        <BarChart3 className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-headline text-2xl">Esperando datos</h2>
                    <p className="max-w-xs text-muted-foreground">Cargue uno o más archivos de Excel o añada una visita para visualizar el panel de control.</p>
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
