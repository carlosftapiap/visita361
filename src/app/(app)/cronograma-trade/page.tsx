
"use client";

import { useState, useEffect } from 'react';
import { Trash2, Plus, Copy, AlertCircle, CalendarClock } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getVisits, addVisit, updateVisit, addBatchVisits, deleteAllVisits } from '@/services/visitService';
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
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const { toast } = useToast();
  const [pendingData, setPendingData] = useState<Omit<Visit, 'id'>[] | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const visits = await getVisits();
      setData(visits);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileProcessed = (processedData: Omit<Visit, 'id'>[]) => {
    if (data.length > 0) {
      setPendingData(processedData);
      setShowOverwriteConfirm(true);
    } else {
      uploadNewData(processedData);
    }
  };

  const uploadNewData = async (dataToUpload: Omit<Visit, 'id'>[]) => {
    setLoading(true);
    try {
      await addBatchVisits(dataToUpload);
      await fetchData();
      toast({
        title: 'Éxito',
        description: `${dataToUpload.length} registros han sido guardados en la base de datos.`,
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los registros. Revise la consola para más detalles.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReplaceData = async () => {
    if (!pendingData) return;

    setShowOverwriteConfirm(false);
    setLoading(true);
    
    try {
      await deleteAllVisits();
      await addBatchVisits(pendingData);
      await fetchData();
      toast({
        title: 'Datos Reemplazados',
        description: `Se han reemplazado los datos con ${pendingData.length} nuevos registros.`,
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error al reemplazar',
        description: 'Ocurrió un error al reemplazar los datos.',
      });
    } finally {
      setLoading(false);
      setPendingData(null);
    }
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
    } catch(err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudieron eliminar los datos. Revise la consola para más detalles.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSaveVisit = async (visitToSave: Visit) => {
    const visitExists = data.some(v => v.id === visitToSave.id);
    try {
      if (visitExists) {
        await updateVisit(visitToSave.id, visitToSave);
        toast({ title: 'Éxito', description: 'Visita actualizada correctamente.' });
      } else {
        await addVisit(visitToSave);
        toast({ title: 'Éxito', description: 'Visita creada correctamente.' });
      }
      await fetchData();
      setFormState({ open: false, visit: null });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudo guardar la visita. Revise la consola para más detalles.",
      });
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
    try {
      await addBatchVisits(newVisits);
      await fetchData();
      toast({
        title: "Éxito",
        description: `${newVisits.length} visitas han sido duplicadas y guardadas.`,
      });
    } catch(err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error al duplicar",
        description: "No se pudieron guardar las visitas duplicadas.",
      });
    } finally {
      setIsDuplicateDialogOpen(false);
      setLoading(false);
    }
  };

  if (error) {
    return (
        <div className="p-4 md:p-6 lg:p-8">
            <Card className="shadow-lg bg-destructive/10 border-destructive border-2">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <AlertCircle className="h-10 w-10 text-destructive flex-shrink-0" />
                        <div>
                            <CardTitle className="font-headline text-3xl text-destructive">No se Pueden Cargar los Datos: Problema de Configuración</CardTitle>
                            <CardDescription className="text-destructive/90 text-base">
                                La conexión con la base de datos de Firebase está fallando. Esto casi siempre se debe a un error en la configuración de su proyecto.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 text-sm text-destructive-foreground/90">
                    <p className="font-bold text-lg">Por favor, siga esta guía de 3 pasos para solucionarlo:</p>
                    
                    <Card className="bg-background/60 p-4">
                        <h3 className="font-bold text-md mb-2">Paso 1: Cree y Verifique su archivo <code>.env.local</code></h3>
                        <p className="mb-3">En la raíz de su proyecto, asegúrese de que existe un archivo llamado <code>.env.local</code>. Copie la siguiente estructura y rellene con sus propias credenciales de Firebase.</p>
                        <pre className="text-xs bg-black/70 text-white p-3 rounded-md overflow-x-auto">
                            <code>
{`NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:..."`}
                            </code>
                        </pre>
                    </Card>

                    <Card className="bg-background/60 p-4">
                        <h3 className="font-bold text-md mb-2">Paso 2: ¡REINICIE el Servidor! (El paso más importante)</h3>
                        <p>Después de guardar su archivo <code>.env.local</code>, debe **detener y reiniciar completamente el servidor de desarrollo**. La aplicación no leerá las nuevas credenciales hasta que no lo haga.</p>
                    </Card>

                     <Card className="bg-background/60 p-4">
                        <h3 className="font-bold text-md mb-2">Paso 3: Verifique las Reglas de Seguridad de Firestore</h3>
                        <p className="mb-3">Vaya a su <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Consola de Firebase</a>, seleccione su proyecto, vaya a **Firestore Database** y luego a la pestaña **Reglas**. Copie y pegue las siguientes reglas para permitir el acceso durante el desarrollo.
                        </p>
                        <pre className="text-xs bg-black/70 text-white p-3 rounded-md overflow-x-auto">
                            <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Permite leer y escribir a cualquiera hasta fin de 2025.
      // Ideal para empezar a desarrollar.
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}`}
                            </code>
                        </pre>
                    </Card>

                    <Card className="bg-destructive/20 p-4 mt-2 border border-destructive">
                        <h4 className="font-bold mb-2 text-destructive-foreground">Mensaje de Error del Sistema:</h4>
                        <pre className="text-sm text-destructive-foreground bg-transparent p-2 rounded-md overflow-x-auto">
                            <code>{error}</code>
                        </pre>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary">Cronograma Trade</h1>
                <p className="text-muted-foreground">Panel de control de actividades y visitas.</p>
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

    