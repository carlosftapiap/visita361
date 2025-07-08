
"use client";

import { useState, useEffect } from 'react';
import { Trash2, Plus, Copy, CalendarClock } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DashboardSkeleton from '@/components/dashboard-skeleton';


export default function CronogramaTradePage() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();
  const [pendingData, setPendingData] = useState<Omit<Visit, 'id'>[] | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  useEffect(() => {
    // Simulate initial loading for skeleton
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFileProcessed = (processedData: Omit<Visit, 'id'>[]) => {
    if (data.length > 0) {
      setPendingData(processedData);
      setShowOverwriteConfirm(true);
    } else {
      uploadNewData(processedData);
    }
  };

  const uploadNewData = (dataToUpload: Omit<Visit, 'id'>[]) => {
    setLoading(true);
    const dataWithIds = dataToUpload.map((visit, index) => ({
      ...visit,
      id: `file-${Date.now()}-${index}`
    }));
    setData(dataWithIds);
    toast({
      title: 'Éxito',
      description: `${dataToUpload.length} registros han sido cargados en memoria.`,
    });
    setLoading(false);
  };
  
  const handleReplaceData = async () => {
    if (!pendingData) return;

    setShowOverwriteConfirm(false);
    setLoading(true);

    const dataWithIds = pendingData.map((visit, index) => ({
      ...visit,
      id: `file-replace-${Date.now()}-${index}`
    }));
    setData(dataWithIds);
    
    toast({
      title: 'Datos Reemplazados',
      description: `Se han reemplazado los datos con ${pendingData.length} nuevos registros.`,
    });
    
    setLoading(false);
    setPendingData(null);
  };

  const handleReset = async () => {
    setLoading(true);
    setData([]);
    toast({
      title: "Datos Eliminados",
      description: "Toda la información ha sido borrada de la memoria.",
    });
    setLoading(false);
  }

  const handleSaveVisit = async (visitToSave: Visit) => {
    const visitExists = data.some(v => v.id === visitToSave.id);
    
    if (visitExists) {
      setData(prevData => prevData.map(v => v.id === visitToSave.id ? visitToSave : v));
      toast({ title: 'Éxito', description: 'Visita actualizada correctamente.' });
    } else {
      setData(prevData => [...prevData, visitToSave]);
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
  
  const handleDuplicateMonth = async (sourceMonthStr: string, targetMonthStr: string) => {
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

    const newVisits: Omit<Visit, 'id'>[] = sourceVisits.map((visit) => {
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
    const dataWithIds = newVisits.map((visit, index) => ({
      ...visit,
      id: `dup-${Date.now()}-${index}`
    }));
    
    setData(prevData => [...prevData, ...dataWithIds]);
    
    toast({
      title: "Éxito",
      description: `${newVisits.length} visitas han sido duplicadas y guardadas.`,
    });
    
    setIsDuplicateDialogOpen(false);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary">Cronograma Trade (Memoria Local)</h1>
                <p className="text-muted-foreground">Panel de control de actividades y visitas. Los datos no se guardarán permanentemente.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={loading || data.length === 0} className="flex-1 sm:flex-none">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar Mes
                </Button>
                <Button onClick={handleAddVisitClick} className="flex-1 sm:flex-none" disabled={loading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Visita
                </Button>
                {!loading && data.length > 0 && (
                    <Button onClick={handleReset} variant="destructive" className="flex-1 sm:flex-none">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Datos
                    </Button>
                )}
            </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
            <div className="w-full lg:w-96 lg:shrink-0">
              <FileUploader onFileProcessed={handleFileProcessed} disabled={loading} />
            </div>
            <div className="flex-1">
              {loading ? (
                <DashboardSkeleton />
              ) : data.length > 0 ? (
                <Dashboard data={data} onEditVisit={handleEditVisit} />
              ) : (
                <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                    <CardContent className="flex flex-col items-center gap-4 p-6">
                        <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                            <CalendarClock className="h-16 w-16 text-primary" />
                        </div>
                        <h2 className="font-headline text-2xl">Aún no hay actividades</h2>
                        <p className="max-w-xs text-muted-foreground">Cargue un archivo Excel o añada una visita manualmente para comenzar a visualizar el cronograma.</p>
                    </CardContent>
                </Card>
              )}
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
        <AlertDialog 
            open={showOverwriteConfirm} 
            onOpenChange={(isOpen) => {
                setShowOverwriteConfirm(isOpen);
                if (!isOpen) {
                    setPendingData(null);
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Desea reemplazar los datos existentes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ya hay información cargada. Al continuar, se eliminarán todos los datos actuales
                        y se reemplazarán por los del archivo. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReplaceData}>Reemplazar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
