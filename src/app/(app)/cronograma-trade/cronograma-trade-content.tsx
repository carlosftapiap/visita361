
"use client";

import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Trash2, Plus, Copy, CalendarClock, AlertTriangle, RefreshCw, Loader2, Settings, User, Activity, Download, Filter } from 'lucide-react';
import type { Visit } from '@/types';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import DuplicateMonthDialog from '@/components/duplicate-month-dialog';
import ActivityCalendar from '@/components/activity-calendar';
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
  getAllVisitsForDuplication,
  addVisit,
  updateVisit,
  deleteVisit,
  addBatchVisits,
  deleteAllVisits,
  deleteVisitsInMonthsForExecutives,
} from '@/services/visitService';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/context/UserContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface PendingData {
    data: Omit<Visit, 'id'>[];
    executivesByMonth: Record<string, string[]>;
}

export default function CronogramaTradeContent() {
  const [data, setData] = useState<Visit[]>([]);
  const [allTimeData, setAllTimeData] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [filters, setFilters] = useState({
      month: format(new Date(), 'yyyy-MM'),
      trade_executive: 'all',
      agent: 'all',
  });
  const [localFilters, setLocalFilters] = useState({
      city: 'all',
      activity: 'all',
      zone: 'all',
      chain: 'all',
  });

  const { user } = useUser();
  const isAdmin = user?.email === "carlosftapiap@gmail.com";

  const refreshData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [visits, allVisits] = await Promise.all([
        getVisits(filters),
        getAllVisitsForDuplication()
      ]);
      setData(visits);
      setAllTimeData(allVisits);
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      const message = error.message || "No se pudieron obtener los datos de la base de datos.";
      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Error al Cargar Datos",
        description: "No se pudo conectar a la base de datos. Revisa el mensaje en pantalla.",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(visit => {
        const cityMatch = localFilters.city === 'all' || visit['CIUDAD'] === localFilters.city;
        const activityMatch = localFilters.activity === 'all' || visit['ACTIVIDAD'] === localFilters.activity;
        const zoneMatch = localFilters.zone === 'all' || visit['ZONA'] === localFilters.zone;
        const chainMatch = localFilters.chain === 'all' || visit['CADENA'] === localFilters.chain;
        return cityMatch && activityMatch && zoneMatch && chainMatch;
    });
  }, [data, localFilters]);

  const filterOptions = useMemo(() => {
    const getUniqueNonEmpty = (items: (string | null | undefined)[]) => 
        ['all', ...[...new Set(items.filter((item): item is string => !!item && item.trim() !== ''))].sort()];
    
    const cities = getUniqueNonEmpty(data.map(v => v['CIUDAD']));
    const activities = getUniqueNonEmpty(data.map(v => v['ACTIVIDAD']));
    const zones = getUniqueNonEmpty(data.map(v => v['ZONA']));
    const chains = getUniqueNonEmpty(data.map(v => v['CADENA']));
    
    return { cities, activities, zones, chains };
  }, [data]);
  
  const handleLocalFilterChange = (filterName: keyof typeof localFilters) => (value: string) => {
    setLocalFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleDownloadPdf = () => {
    if (filteredData.length === 0) return;

    const doc = new jsPDF();
    
    const mainTitle = "Reporte de Actividades - Visita360";
    const date = `Fecha: ${format(new Date(), 'dd/MM/yyyy')}`;
    const monthLabel = capitalize(format(startOfMonth(new Date(filters.month + '-02')), 'MMMM yyyy', { locale: es }));
    
    const filterText = `Filtros Aplicados: 
    - Mes: ${monthLabel}
    - Ejecutiva: ${filters.trade_executive === 'all' ? 'Todas' : filters.trade_executive}
    - Asesor: ${filters.agent === 'all' ? 'Todos' : filters.agent}
    - Ciudad: ${localFilters.city === 'all' ? 'Todas' : localFilters.city}
    - Cadena: ${localFilters.chain === 'all' ? 'Todas' : localFilters.chain}
    - Zona: ${localFilters.zone === 'all' ? 'Todas' : localFilters.zone}
    - Actividad: ${localFilters.activity === 'all' ? 'Todas' : localFilters.activity}`;

    doc.setFontSize(18);
    doc.text(mainTitle, 14, 22);
    doc.setFontSize(11);
    doc.text(date, 14, 30);
    
    doc.setFontSize(10);
    doc.text(filterText, 14, 38);

    const tableColumn = ["Fecha", "Ejecutiva", "Asesor", "Cadena", "Actividad", "Costo Materiales", "Presupuesto"];
    const tableRows: any[][] = [];

    filteredData.forEach(visit => {
        const visitData = [
            visit['FECHA'] ? new Date(visit['FECHA']).toLocaleDateString('es-CO') : 'N/A',
            visit['EJECUTIVA DE TRADE'],
            visit['ASESOR COMERCIAL'],
            visit['CADENA'],
            visit['ACTIVIDAD'],
            visit.total_cost ? visit.total_cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$0',
            visit['PRESUPUESTO'] ? visit['PRESUPUESTO'].toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : 'N/A'
        ];
        tableRows.push(visitData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        headStyles: { fillColor: [75, 0, 130] }, // Indigo
    });
    
    doc.save(`Visita360_Reporte_${filters.month}.pdf`);
  };

  const handleFileProcessed = (processedData: Omit<Visit, 'id'>[]) => {
      if (processedData.length === 0) return;
  
      const executivesByMonth: Record<string, string[]> = {};
      const monthExecutiveSet = new Set<string>();
  
      processedData.forEach(v => {
          const month = format(new Date(v['FECHA']), 'yyyy-MM');
          const executive = v['EJECUTIVA DE TRADE'];
          const key = `${month}|${executive}`;
  
          if (!monthExecutiveSet.has(key)) {
              if (!executivesByMonth[month]) {
                  executivesByMonth[month] = [];
              }
              executivesByMonth[month].push(executive);
              monthExecutiveSet.add(key);
          }
      });
  
      const existingRecords = new Set(data.map(v => `${format(new Date(v['FECHA']), 'yyyy-MM')}|${v['EJECUTIVA DE TRADE']}`));
      const overlappingExecutivesByMonth: Record<string, string[]> = {};
      
      for(const month in executivesByMonth) {
          for(const executive of executivesByMonth[month]) {
              if (existingRecords.has(`${month}|${executive}`)) {
                  if(!overlappingExecutivesByMonth[month]) {
                      overlappingExecutivesByMonth[month] = [];
                  }
                  if(!overlappingExecutivesByMonth[month].includes(executive)) {
                      overlappingExecutivesByMonth[month].push(executive);
                  }
              }
          }
      }
      
      if (Object.keys(overlappingExecutivesByMonth).length > 0 && !errorMessage) {
          setPendingData({ data: processedData, executivesByMonth: overlappingExecutivesByMonth });
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
    } catch (error: any) {
      console.error("Error uploading new data:", error);
      setErrorMessage(error.message);
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
          await deleteVisitsInMonthsForExecutives(pendingData.executivesByMonth);
          await addBatchVisits(pendingData.data);
          await refreshData();
          toast({
              title: 'Datos Reemplazados',
              description: `Se han actualizado los datos para las ejecutivas y meses correspondientes con ${pendingData.data.length} nuevos registros.`,
          });
      } catch (error: any) {
          console.error("Error replacing data:", error);
          setErrorMessage(error.message);
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
    setShowResetConfirm(false);
    setLoading(true);
    setErrorMessage(null);
    try {
        await deleteAllVisits();
        setData([]); // Clear data locally immediately
        await refreshData(); // Re-fetch to confirm and update other states
        toast({
          title: "Datos Eliminados",
          description: "Toda la información ha sido borrada.",
        });
    } catch(error: any) {
        console.error("Error deleting data:", error);
        setErrorMessage(error.message);
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
            await addVisit(visitData as Omit<Visit, 'id'>);
        }
        await refreshData();
        setFormState({ open: false, visit: null });
        toast({ title: 'Éxito', description: 'Visita guardada correctamente.' });
    } catch (error: any) {
        console.error("Error saving visit:", error);
        setErrorMessage(error.message);
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudo guardar la visita. Revisa el mensaje en pantalla.',
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (!deletingVisit) return;
    
    setLoading(true);
    setErrorMessage(null);
    try {
      await deleteVisit(deletingVisit.id);
      await refreshData();
      setDeletingVisit(null);
      toast({ title: 'Visita Eliminada', description: 'La visita ha sido eliminada correctamente.' });
    } catch (error: any) {
       console.error("Error deleting visit:", error);
        setErrorMessage(error.message);
        toast({
            variant: 'destructive',
            title: 'Error al Eliminar',
            description: 'No se pudo eliminar la visita. Revisa el mensaje en pantalla.',
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

    const sourceVisits = allTimeData.filter(visit => {
        const visitDate = new Date(visit['FECHA']);
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
        const originalDate = new Date(visit['FECHA']);
        const dayOfMonth = originalDate.getDate();
        const dayToSet = Math.min(dayOfMonth, lastDayOfTargetMonth);
        const targetDate = new Date(targetYear, targetMonthNum - 1, dayToSet);
        const { id, ...rest } = visit;
        return {
            ...rest,
            'FECHA': targetDate.toISOString(),
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
    } catch (error: any) {
        console.error("Error duplicating month:", error);
        setErrorMessage(error.message);
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

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  }

  const renderContent = () => {
    if (loading) {
      return <DashboardSkeleton />;
    }
    if (errorMessage) {
      return (
        <Card className="shadow-md border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                <AlertTriangle /> Error de Conexión o Configuración
            </CardTitle>
            <CardDescription className="text-destructive/90">
                No se pudo completar la operación debido a un problema. Revisa el siguiente mensaje para solucionarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2 text-card-foreground">Mensaje de Error Detallado:</h3>
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
    
    return (
        <div className="flex flex-col gap-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><Filter className="text-primary"/> Filtros del Panel</CardTitle>
                    <CardDescription>Refine los datos para un análisis más detallado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                         <div>
                            <label className="text-sm font-medium">Ciudad</label>
                            <Select onValueChange={handleLocalFilterChange('city')} defaultValue="all" disabled={filterOptions.cities.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.cities.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todas las ciudades' : c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cadena</label>
                            <Select onValueChange={handleLocalFilterChange('chain')} defaultValue="all" disabled={filterOptions.chains.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.chains.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todas las cadenas' : c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Zona</label>
                            <Select onValueChange={handleLocalFilterChange('zone')} defaultValue="all" disabled={filterOptions.zones.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z === 'all' ? 'Todas las zonas' : z}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Actividad</label>
                            <Select onValueChange={handleLocalFilterChange('activity')} defaultValue="all" disabled={filterOptions.activities.length <= 1}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {filterOptions.activities.map(a => <SelectItem key={a} value={a}>{a === 'all' ? 'Todas las actividades' : a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleDownloadPdf} variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Reporte PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <ActivityCalendar
                data={data}
                filters={filters}
                onFilterChange={handleFilterChange}
                onEditVisit={handleEditVisit}
                allVisits={allTimeData}
                isAdmin={isAdmin}
            />
            <Dashboard 
                data={filteredData}
                onEditVisit={handleEditVisit}
                onDeleteVisit={(visit) => setDeletingVisit(visit)}
                isAdmin={isAdmin}
                hasData={data.length > 0}
            />
        </div>
    );
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary">Cronograma Trade</h1>
                <p className="text-muted-foreground">Panel de control de actividades y visitas conectado a Supabase.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={handleAddVisitClick} className="flex-1 sm:flex-none" disabled={loading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Visita
                </Button>
                {isAdmin && (
                    <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline" size="icon" disabled={loading} title="Cargar y configurar datos">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Cargar y configurar datos</span>
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
            data={allTimeData}
        />
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cargar y Configurar Datos</DialogTitle>
                    <DialogDescription>
                        Cargue archivos, duplique cronogramas y administre sus datos.
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4 space-y-4">
                    <FileUploader 
                        onFileProcessed={(processedData) => {
                            handleFileProcessed(processedData);
                            setIsUploadDialogOpen(false);
                        }} 
                        disabled={loading}
                    />
                    <Separator />
                    <Button 
                      onClick={() => {
                        setIsDuplicateDialogOpen(true);
                        setIsUploadDialogOpen(false);
                      }} 
                      variant="outline" 
                      disabled={loading || allTimeData.length === 0} 
                      className="w-full"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar Cronograma de un Mes
                    </Button>
                </div>
                {isAdmin && !loading && allTimeData.length > 0 && (
                  <div className="pt-4">
                    <Separator className="my-4" />
                    <h3 className="font-semibold text-lg mb-2">Acciones de Zona de Peligro</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Estas acciones son destructivas y no se pueden deshacer.
                    </p>
                    <Button 
                      onClick={() => {
                        setShowResetConfirm(true);
                        setIsUploadDialogOpen(false);
                      }} 
                      variant="destructive" 
                      className="w-full"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Todos los Datos
                    </Button>
                  </div>
                )}
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
                    <AlertDialogTitle>¿Reemplazar datos existentes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ya hay datos para las siguientes ejecutivas y meses. Si continúa, sus registros existentes para estos periodos serán <span className="font-bold text-destructive">eliminados y reemplazados</span> por los del archivo.
                        <br/>
                        Esta acción no se puede deshacer. Las demás ejecutivas no se verán afectadas.
                    </AlertDialogDescription>
                    <div className="mt-2 space-y-2 max-h-48 overflow-auto text-sm">
                       {pendingData && Object.entries(pendingData.executivesByMonth).map(([month, executives]) => (
                           <div key={month}>
                               <strong className="font-semibold text-card-foreground">{capitalize(format(new Date(month + '-02'), 'MMMM yyyy', { locale: es }))}</strong>
                               <ul className="list-disc pl-5 text-muted-foreground">
                                   {executives.map(exec => <li key={exec}>{exec}</li>)}
                               </ul>
                           </div>
                       ))}
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReplaceData}>Reemplazar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!deletingVisit} onOpenChange={(isOpen) => !isOpen && setDeletingVisit(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción es irreversible. Se eliminará permanentemente la visita para <span className="font-bold">{deletingVisit?.['CADENA']} el {deletingVisit && format(new Date(deletingVisit.FECHA), 'PPP', {locale: es})}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteVisit}>
                    Sí, eliminar visita
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Se eliminarán permanentemente todas las visitas y actividades de la base de datos.
                No podrá recuperar estos datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Sí, eliminar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    