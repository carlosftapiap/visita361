"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, BarChart3, Plus, Copy, Loader2, AlertCircle } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [dbError, setDbError] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();

  const refetchData = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const visits = await getVisits();
      setData(visits);
    } catch (error: any) {
      console.error("Error connecting to database:", error);
      const errorMessage = error.message || "Ocurrió un error desconocido al conectar con la base de datos.";
      setDbError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  const handleDataProcessed = async (processedData: Visit[]) => {
    if (dbError) {
       toast({
        variant: "destructive",
        title: "Error de Base de Datos",
        description: "No se pueden procesar datos nuevos. Por favor, solucione el problema de conexión.",
      });
      return;
    }
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
    if (dbError) return;
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
    if (dbError) return;
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
    if (!data || dbError) return;

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

  const isDataReady = !loading && !dbError && data.length > 0;
  const showEmptyState = !loading && !dbError && data.length === 0;

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
            <Button onClick={() => setIsDuplicateDialogOpen(true)} variant="outline" disabled={loading || !!dbError || data.length === 0}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar Mes
            </Button>
            <Button onClick={handleAddVisitClick} disabled={loading || !!dbError}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Visita
            </Button>
            {isDataReady && (
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
                    <h2 className="font-headline text-2xl">Conectando...</h2>
                    <p className="max-w-xs text-muted-foreground">Estableciendo conexión con la base de datos de Firebase.</p>
                </CardContent>
            </Card>
          ) : dbError ? (
            <Card className="flex min-h-[60vh] flex-col items-center justify-center border-destructive shadow-md">
                <CardHeader className="flex flex-col items-center gap-4 p-6 text-center">
                    <AlertCircle className="h-16 w-16 text-destructive" />
                    <CardTitle className="text-2xl font-bold text-destructive">Error de Conexión</CardTitle>
                </CardHeader>
                <CardContent className="w-full max-w-3xl px-6 pb-6 text-left">
                    <p className="pb-4 text-center text-muted-foreground">No se pudo establecer conexión con la base de datos de Firestore.</p>
                    <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
                        <h3 className="mb-2 font-semibold text-card-foreground">Pasos para solucionarlo:</h3>
                        <ul className="list-decimal list-inside space-y-3 text-muted-foreground">
                            <li>Asegúrate de haber creado un archivo <strong><code>.env.local</code></strong> en la raíz de tu proyecto.</li>
                            <li>Verifica que el archivo <strong><code>.env.local</code></strong> contenga las credenciales correctas de tu proyecto de Firebase, como se muestra a continuación.
                                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">{`NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}</pre>
                            </li>
                            <li>Comprueba tus <strong>Reglas de Seguridad</strong> de Firestore para permitir la lectura y escritura.</li>
                            <li>Después de crear o modificar el archivo <code>.env.local</code>, <strong>reinicia el servidor de desarrollo</strong>.</li>
                        </ul>
                    </div>
                    {dbError && (
                        <div className="mt-4">
                            <h3 className="mb-2 font-semibold text-card-foreground">Mensaje de error detallado:</h3>
                            <pre className="w-full whitespace-pre-wrap rounded-md bg-destructive/10 p-4 text-xs font-mono text-destructive">{dbError}</pre>
                        </div>
                    )}
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
                    <p className="max-w-xs text-muted-foreground">La conexión con la base de datos fue exitosa, pero no hay datos. Cargue un archivo o añada una visita.</p>
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
