"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, BarChart3, Plus, Copy, Loader2, AlertTriangle } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getVisits, addBatchVisits, deleteAllVisits, addVisit, updateVisit } from '@/services/visitService';

export default function Home() {
  const [data, setData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const visits = await getVisits();
      setData(visits);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDataProcessed = async (processedData: Omit<Visit, 'id'>[]) => {
    try {
      await addBatchVisits(processedData);
      toast({
          title: 'Éxito',
          description: `${processedData.length} registros han sido añadidos a la base de datos.`,
      });
      await fetchData();
    } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: "No se pudieron añadir los registros a la base de datos."
        });
        setError(err.message);
    }
  };

  const handleReset = async () => {
    try {
        await deleteAllVisits();
        toast({
            title: "Datos Eliminados",
            description: "Toda la información ha sido borrada de la base de datos.",
        });
        await fetchData();
    } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se pudieron borrar los datos."
        });
        setError(err.message);
    }
  }

  const handleSaveVisit = async (visitToSave: Visit) => {
    const isNew = !formState.visit;
    try {
      if (isNew) {
        const { id, ...newVisit } = visitToSave;
        await addVisit(newVisit);
        toast({ title: 'Éxito', description: 'Visita creada correctamente.' });
      } else {
        const { id, ...updatedVisit } = visitToSave;
        await updateVisit(formState.visit!.id, updatedVisit);
        toast({ title: 'Éxito', description: 'Visita actualizada correctamente.' });
      }
      await fetchData();
      setFormState({ open: false, visit: null });
    } catch (err: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar la visita.',
        });
        setError(err.message);
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
    
    try {
        await addBatchVisits(newVisits);
        toast({
            title: "Éxito",
            description: `${newVisits.length} visitas han sido duplicadas al nuevo mes.`,
        });
        await fetchData();
        setIsDuplicateDialogOpen(false);
    } catch(err: any) {
        toast({
            variant: "destructive",
            title: "Error al duplicar",
            description: "No se pudieron guardar las visitas duplicadas."
        });
        setError(err.message);
    }
  };

  const isDataReady = !loading && data.length > 0 && !error;
  const showEmptyState = !loading && data.length === 0 && !error;

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-2xl m-4 shadow-2xl border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-destructive font-headline">
                        <AlertTriangle className="h-8 w-8" />
                        Error de Conexión con la Base de Datos
                    </CardTitle>
                    <CardDescription>
                        No se pudo establecer la conexión con Firebase. Por favor, revise los siguientes puntos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="p-4 rounded-md bg-muted">
                        <h3 className="font-semibold">Paso 1: Verifique el archivo <code>.env.local</code></h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Asegúrese de que existe un archivo llamado <code>.env.local</code> en la raíz de su proyecto y que contiene todas sus credenciales de Firebase.
                        </p>
                        <pre className="mt-2 p-2 text-xs bg-black text-white rounded-md overflow-x-auto">
                            <code>
{`NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."`}
                            </code>
                        </pre>
                        <p className="text-sm text-muted-foreground mt-2">
                            Si acaba de crear o modificar este archivo, debe <strong>reiniciar el servidor de desarrollo</strong> para que los cambios surtan efecto.
                        </p>
                    </div>
                     <div className="p-4 rounded-md bg-muted">
                        <h3 className="font-semibold">Paso 2: Reglas de Seguridad de Firestore</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Verifique que las reglas de seguridad de su base de datos en la consola de Firebase permitan la lectura y escritura. Para desarrollo, puede usar las siguientes reglas (<strong>no recomendadas para producción</strong>):
                        </p>
                        <pre className="mt-2 p-2 text-xs bg-black text-white rounded-md">
                            <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                            </code>
                        </pre>
                    </div>
                    <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
                         <h3 className="font-semibold text-destructive">Mensaje de Error Original</h3>
                         <p className="font-mono text-sm text-destructive mt-1">{error}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

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
                    <h2 className="font-headline text-2xl">Conectando a la Base de Datos...</h2>
                    <p className="max-w-xs text-muted-foreground">Cargando los datos de las visitas.</p>
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
