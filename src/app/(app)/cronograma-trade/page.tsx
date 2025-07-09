
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Plus, Copy, CalendarClock, AlertTriangle, RefreshCw, Loader2, Settings } from 'lucide-react';
import type { Visit } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  getVisits,
  addVisit,
  updateVisit,
  addBatchVisits,
  deleteAllVisits,
  deleteVisitsInMonths,
} from '@/services/visitService';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function CronogramaTradePage() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [pendingData, setPendingData] = useState<{ data: Omit<Visit, 'id'>[]; months: string[] } | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const visits = await getVisits();
      setData(visits);
    } catch (error) {
      console.error("Error refreshing data:", error);
      const message = error instanceof Error ? error.message : "No se pudieron obtener los datos de la base de datos.";
      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Error al Cargar Datos",
        description: "No se pudo conectar a la base de datos. Revisa el mensaje en pantalla.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const loadedMonthsFormatted = useMemo(() => {
    if (!data || data.length === 0) return [];
    const months = [...new Set(data.map(v => format(v.date, 'yyyy-MM')))].sort().reverse();
    return months.map(m => capitalize(format(new Date(m + '-02'), 'MMMM yyyy', { locale: es })));
  }, [data]);

  const handleFileProcessed = (processedData: Omit<Visit, 'id'>[]) => {
    if (processedData.length === 0) return;

    const uploadedMonths = [...new Set(processedData.map(v => format(v.date, 'yyyy-MM')))];
    const existingMonths = [...new Set(data.map(v => format(v.date, 'yyyy-MM')))];
    
    const overlappingMonths = uploadedMonths.filter(m => existingMonths.includes(m));

    if (overlappingMonths.length > 0 && !errorMessage) {
      setPendingData({ data: processedData, months: overlappingMonths });
      setShowOverwriteConfirm(true);
    } else {
      uploadNewData(processedData);
    }
  };

  const uploadNewData = async (dataToUpload: Omit<Visit, 'id'>[]) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await addBatchVisits(dataToUpload);
      await refreshData();
      toast({
        title: 'Éxito',
        description: `${dataToUpload.length} registros han sido cargados y guardados.`,
      });
    } catch (error) {
      console.error("Error uploading new data:", error);
      const message = error instanceof Error ? error.message : "No se pudieron guardar los nuevos registros.";
      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudieron guardar los nuevos registros. Revisa el mensaje en pantalla.",
      });
    } finally {
        setLoading(false);
    }
  };
  
  const handleReplaceData = async () => {
    if (!pendingData) return;

    setShowOverwriteConfirm(false);
    setLoading(true);
    setErrorMessage(null);

    try {
        await deleteVisitsInMonths(pendingData.months);
        await addBatchVisits(pendingData.data);
        await refreshData();
        toast({
            title: 'Datos Reemplazados',
            description: `Se han actualizado los datos para los meses correspondientes con ${pendingData.data.length} nuevos registros.`,
        });
    } catch (error) {
        console.error("Error replacing data:", error);
        const message = error instanceof Error ? error.message : "No se pudieron reemplazar los datos.";
        setErrorMessage(message);
        toast({
            variant: "destructive",
            title: "Error al Reemplazar",
            description: "No se pudieron reemplazar los datos. Revisa el mensaje en pantalla.",
        });
    } finally {
        setLoading(false);
        setPendingData(null);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
        await deleteAllVisits();
        setData([]); // Clear data locally immediately
        toast({
          title: "Datos Eliminados",
          description: "Toda la información ha sido borrada.",
        });
    } catch(error) {
        console.error("Error deleting data:", error);
        const message = error instanceof Error ? error.message : "No se pudo borrar la información.";
        setErrorMessage(message);
        toast({
            variant: "destructive",
            title: "Error al Eliminar",
            description: "No se pudo borrar la información. Revisa el mensaje en pantalla.",
        });
    } finally {
        setLoading(false);
    }
  }

  const handleSaveVisit = async (visitToSave: Visit) => {
    const { id, ...visitData } = visitToSave;
    
    setLoading(true);
    setErrorMessage(null);
    try {
        if (formState.visit && formState.visit.id) { // Editing existing visit
            await updateVisit(id, visitData);
        } else { // Creating new visit
            await addVisit(visitData);
        }
        await refreshData();
        toast({ title: 'Éxito', description: 'Visita guardada correctamente.' });
        setFormState({ open: false, visit: null });
    } catch (error) {
        console.error("Error saving visit:", error);
        const message = error instanceof Error ? error.message : "No se pudo guardar la visita.";
        setErrorMessage(message);
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudo guardar la visita. Revisa el mensaje en pantalla.',
        });
    } finally {
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
    setErrorMessage(null);
    try {
        await addBatchVisits(newVisits);
        await refreshData();
        toast({
          title: "Éxito",
          description: `${newVisits.length} visitas han sido duplicadas y guardadas.`,
        });
    } catch (error) {
        console.error("Error duplicating month:", error);
        const message = error instanceof Error ? error.message : "No se pudieron duplicar las visitas.";
        setErrorMessage(message);
        toast({
            variant: "destructive",
            title: "Error al Duplicar",
            description: "No se pudieron duplicar las visitas. Revisa el mensaje en pantalla.",
        });
    } finally {
        setIsDuplicateDialogOpen(false);
        setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <DashboardSkeleton />;
    }
    if (errorMessage) {
      return (
        <Card className="shadow-md border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                <AlertTriangle /> Error de Configuración de la Base de Datos
            </CardTitle>
            <CardDescription className="text-destructive/90">
                No se pudo completar la operación debido a un problema de conexión o configuración con la base de datos de Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2 text-card-foreground">Sigue estas instrucciones para solucionarlo:</h3>
            <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                {errorMessage}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={refreshData} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Reintentar Conexión
            </Button>
          </CardFooter>
        </Card>
      );
    }
    if (data.length > 0) {
      return <Dashboard data={data} onEditVisit={handleEditVisit} />;
    }
    return (
      <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                  <CalendarClock className="h-16 w-16 text-primary" />
              </div>
              <h2 className="font-headline text-2xl">Aún no hay actividades</h2>
              <p className="max-w-xs text-muted-foreground">Cargue un archivo Excel o añada una visita manualmente para comenzar a visualizar el cronograma.</p>
          </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary">Cronograma Trade</h1>
                <p className="text-muted-foreground">Panel de control de actividades y visitas conectado a Supabase.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={loading || data.length === 0} className="flex-1 sm:flex-none">
                    <Copy className="mr-2 h-4 w-4" />
                    Cronograma nuevo
                </Button>
                <Button onClick={handleAddVisitClick} className="flex-1 sm:flex-none" disabled={loading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Visita
                </Button>
                <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline" size="icon" disabled={loading} title="Cargar y configurar datos">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Cargar y configurar datos</span>
                </Button>
                {!loading && data.length > 0 && (
                    <Button onClick={handleReset} variant="destructive" className="flex-1 sm:flex-none">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Datos
                    </Button>
                )}
            </div>
        </div>
        
        <div className="flex-1">
          {renderContent()}
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
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cargar y Configurar Datos</DialogTitle>
                    <DialogDescription>
                        Cargue archivos, descargue plantillas y administre sus datos.
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    <FileUploader 
                        onFileProcessed={(processedData) => {
                            handleFileProcessed(processedData);
                            setIsUploadDialogOpen(false);
                        }} 
                        disabled={loading} 
                        loadedMonths={loadedMonthsFormatted}
                    />
                </div>
            </DialogContent>
        </Dialog>
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
                        Ya hay información cargada para {pendingData?.months.length === 1 ? 'el mes de' : 'los meses de'}: <span className="font-semibold text-card-foreground">{pendingData?.months.map(m => capitalize(format(new Date(m + '-02'), 'MMMM yyyy', { locale: es }))).join(', ')}</span>.
                        <br/><br/>
                        Al continuar, se eliminarán todos los datos de {pendingData?.months.length === 1 ? 'este mes' : 'estos meses'} y se reemplazarán por los del archivo. Esta acción no se puede deshacer.
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
