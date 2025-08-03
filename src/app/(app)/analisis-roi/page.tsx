
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Plus, Loader2, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, BadgePercent, Database, RefreshCw, Minus, User, Calendar, MapPin, Tag, Type, FileText, ShoppingCart, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { RoiCampaign } from '@/types';
import { getRoiCampaigns, addRoiCampaign, deleteRoiCampaign } from '@/services/roiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import KpiCard from '@/components/kpi-card';
import { cn } from '@/lib/utils';

const campaignSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  client: z.string().min(1, { message: 'El nombre del cliente es requerido.' }),
  start_date: z.date({ required_error: 'La fecha de inicio es requerida.' }),
  end_date: z.date({ required_error: 'La fecha de fin es requerida.' }),
  zone: z.string().min(1, { message: 'La zona es requerida.' }),
  responsible: z.string().min(1, { message: 'El responsable es requerido.' }),
  investment_type: z.string().min(1, { message: 'El tipo de inversión es requerido.' }),
  amount_invested: z.coerce.number().positive({ message: 'La inversión debe ser un número positivo.' }),
  revenue_generated: z.coerce.number().min(0, { message: 'Los ingresos no pueden ser negativos.' }),
  profit_generated: z.coerce.number(),
  units_sold: z.coerce.number().min(0).optional(),
  comment: z.string().optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["end_date"],
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const roiTableCreationScript = `-- ========= ELIMINAR TABLA ANTERIOR (si existe) =========
DROP TABLE IF EXISTS public.roi_campaigns CASCADE;

-- ========= CREAR TABLA ROI CAMPAIGNS CON CLIENTE Y UTILIDAD =========
CREATE TABLE public.roi_campaigns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    zone TEXT NOT NULL,
    responsible TEXT NOT NULL,
    investment_type TEXT NOT NULL,
    amount_invested NUMERIC NOT NULL CHECK (amount_invested > 0),
    revenue_generated NUMERIC NOT NULL,
    profit_generated NUMERIC NOT NULL,
    units_sold INTEGER,
    comment TEXT,
    roi NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN amount_invested = 0 THEN 0
            ELSE (profit_generated / amount_invested) * 100
        END
    ) STORED
);


-- ========= HABILITAR SEGURIDAD A NIVEL DE FILA (RLS) =========
ALTER TABLE public.roi_campaigns ENABLE ROW LEVEL SECURITY;

-- ========= POLÍTICA DE ACCESO PARA USUARIOS AUTENTICADOS =========
CREATE POLICY "Public full access on roi_campaigns"
ON public.roi_campaigns
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);`;

export default function AnalisisRoiPage() {
    const [campaigns, setCampaigns] = useState<RoiCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deletingCampaign, setDeletingCampaign] = useState<RoiCampaign | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<RoiCampaign | null>(null);
    const { toast } = useToast();

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRoiCampaigns();
            setCampaigns(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({ variant: "destructive", title: "Error al cargar campañas", description: "No se pudieron obtener los datos. Revisa el error en pantalla." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            name: '',
            client: '',
            start_date: new Date(),
            end_date: new Date(),
            zone: '',
            responsible: '',
            investment_type: '',
            amount_invested: 0,
            revenue_generated: 0,
            profit_generated: 0,
            units_sold: 0,
            comment: ''
        }
    });
    
    const revenueGenerated = form.watch('revenue_generated');
    
    useEffect(() => {
        const profit = (revenueGenerated || 0) * 0.15;
        form.setValue('profit_generated', profit, { shouldValidate: true });
    }, [revenueGenerated, form]);

    const calculatedResult = useMemo(() => {
        const invested = form.watch('amount_invested');
        const profit = form.watch('profit_generated');
        const revenue = form.watch('revenue_generated');
        const units = form.watch('units_sold');

        let roi = 0;
        let status: 'Positivo' | 'Negativo' = 'Negativo';
        let statusIcon: React.ElementType = TrendingDown;
        let ticket = 0;

        if (invested > 0) {
            roi = (profit / invested) * 100;
            if (roi > 300) {
                status = 'Positivo';
                statusIcon = TrendingUp;
            } else {
                status = 'Negativo';
                statusIcon = TrendingDown;
            }
        }
        
        if (units && units > 0 && revenue > 0) {
            ticket = revenue / units;
        }

        return {
            roi: roi.toFixed(2),
            status,
            statusIcon,
            ticket: ticket.toFixed(2)
        };
    }, [form.watch('amount_invested'), form.watch('profit_generated'), form.watch('revenue_generated'), form.watch('units_sold')]);

    const handleFormSubmit = async (values: CampaignFormValues) => {
        try {
            await addRoiCampaign(values);
            toast({ title: "Campaña guardada", description: `El análisis para "${values.name}" ha sido guardado.` });
            setIsFormOpen(false);
            await fetchCampaigns();
            form.reset();
        } catch (err: any) {
             toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar el análisis de la campaña." });
        }
    };
    
    const handleDeleteClick = (campaign: RoiCampaign, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingCampaign(campaign);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCampaign) return;
        try {
            await deleteRoiCampaign(deletingCampaign.id);
            toast({ title: "Campaña eliminada", description: `"${deletingCampaign.name}" ha sido borrado.` });
            setDeletingCampaign(null);
            await fetchCampaigns();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el análisis."});
            setDeletingCampaign(null);
        }
    }

    const renderContent = () => {
        if (loading) return <DashboardSkeleton />;
        if (error) {
             return (
                 <Card className="shadow-md border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2"><AlertTriangle /> Error de Base de Datos</CardTitle>
                        <CardDescription className="text-destructive/90">
                            No se pudieron cargar los análisis de ROI. Esto suele ocurrir porque la tabla <strong>`roi_campaigns`</strong> no existe o su estructura es incorrecta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                             <h3 className="font-semibold text-card-foreground">Solución: Crear o Actualizar la Tabla</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-2">Copia el siguiente script SQL y ejecútalo en el <strong>SQL Editor</strong> de tu proyecto de Supabase para crear o reemplazar la tabla necesaria.</p>
                            <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border text-left">
                                {roiTableCreationScript}
                            </pre>
                        </div>
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-card-foreground">Mensaje de Error Original</h3>
                            <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border mt-2 text-left">{error}</pre>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={fetchCampaigns} disabled={loading}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar Conexión
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Historial de Análisis de ROI</CardTitle>
                    <CardDescription>Lista de todas las campañas y su retorno de inversión registrado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-h-[65vh] overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Campaña</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>ROI (%)</TableHead>
                                    <TableHead>Invertido</TableHead>
                                    <TableHead>Utilidad</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.length > 0 ? (
                                    campaigns.map(c => (
                                        <TableRow key={c.id} onClick={() => setSelectedCampaign(c)} className="cursor-pointer">
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell>{c.client}</TableCell>
                                            <TableCell className={cn(
                                                "font-bold",
                                                c.roi > 300 && "text-green-600",
                                                c.roi <= 300 && "text-red-600"
                                            )}>{c.roi.toFixed(2)}%</TableCell>
                                            <TableCell>{c.amount_invested.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell>{c.profit_generated.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell>{c.responsible}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={(e) => handleDeleteClick(c, e)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">No hay campañas registradas. ¡Añada la primera!</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3"><Target /> Análisis de ROI</h1>
                    <p className="text-muted-foreground">Mida el retorno de la inversión de sus actividades de trade marketing.</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Análisis</Button>
            </div>
            
            {!isFormOpen && renderContent()}

            {isFormOpen && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Nuevo Análisis de Campaña</CardTitle>
                        <CardDescription>Complete los campos para calcular el ROI de su inversión.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                             <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre de la campaña</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="client" render={({ field }) => (<FormItem><FormLabel>Nombre del cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="responsible" render={({ field }) => (<FormItem><FormLabel>Responsable</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="zone" render={({ field }) => (<FormItem><FormLabel>Zona / Región</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Costa">Costa</SelectItem><SelectItem value="Sierra">Sierra</SelectItem><SelectItem value="Austro">Austro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel>Fecha de inicio</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel>Fecha de fin</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="investment_type" render={({ field }) => (<FormItem><FormLabel>Tipo de inversión</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Publicidad">Publicidad</SelectItem><SelectItem value="Muestras">Muestras</SelectItem><SelectItem value="Promocion en PDV">Promoción en PDV</SelectItem><SelectItem value="Capacitacion">Capacitación</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="amount_invested" render={({ field }) => (<FormItem><FormLabel>Monto invertido (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="revenue_generated" render={({ field }) => (<FormItem><FormLabel>Ventas Adicionales Generadas (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name="profit_generated" render={({ field }) => (<FormItem className="hidden"><FormLabel>Utilidad generada (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="units_sold" render={({ field }) => (<FormItem><FormLabel>Unidades vendidas</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     </div>
                                    <FormField control={form.control} name="comment" render={({ field }) => (<FormItem><FormLabel>Comentario / Observación</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="md:col-span-1 space-y-4">
                                    <Card className="bg-muted/30">
                                        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <KpiCard icon={BadgePercent} title="ROI" value={`${calculatedResult.roi}%`} />
                                            <KpiCard icon={calculatedResult.statusIcon} title="Estado" value={calculatedResult.status} />
                                            <KpiCard icon={DollarSign} title="Ticket Promedio" value={Number(calculatedResult.ticket) > 0 ? `$${calculatedResult.ticket}` : 'N/A'} />
                                        </CardContent>
                                    </Card>
                                     <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Guardar Análisis
                                        </Button>
                                     </div>
                                </div>
                             </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
            
            <Dialog open={!!selectedCampaign} onOpenChange={(isOpen) => !isOpen && setSelectedCampaign(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedCampaign?.name}</DialogTitle>
                        <DialogDescription>
                            Detalles del análisis de la campaña para el cliente {selectedCampaign?.client}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCampaign && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 py-4 text-sm">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Responsable</p><p className="font-semibold text-card-foreground">{selectedCampaign.responsible}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Zona</p><p className="font-semibold text-card-foreground">{selectedCampaign.zone}</p></div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Type className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Tipo de Inversión</p><p className="font-semibold text-card-foreground">{selectedCampaign.investment_type}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Fecha de Inicio</p><p className="font-semibold text-card-foreground">{format(new Date(selectedCampaign.start_date), "PPP", { locale: es })}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Fecha de Fin</p><p className="font-semibold text-card-foreground">{format(new Date(selectedCampaign.end_date), "PPP", { locale: es })}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BadgePercent className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">ROI</p><p className={cn("font-bold text-card-foreground", selectedCampaign.roi > 300 && "text-green-600", selectedCampaign.roi <= 300 && "text-red-600")}>{selectedCampaign.roi.toFixed(2)}%</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Invertido</p><p className="font-semibold text-card-foreground">{selectedCampaign.amount_invested.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</p></div>
                            </div>
                             <div className="flex items-start gap-3">
                                <TrendingUp className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Ventas Adicionales</p><p className="font-semibold text-card-foreground">{selectedCampaign.revenue_generated.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <TrendingUp className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Utilidad</p><p className="font-semibold text-card-foreground">{selectedCampaign.profit_generated.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</p></div>
                            </div>
                            <div className="flex items-start gap-3 md:col-span-3">
                                <ShoppingCart className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1"><p className="font-medium text-muted-foreground">Unidades Vendidas</p><p className="font-semibold text-card-foreground">{selectedCampaign.units_sold?.toLocaleString('es-CO') || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-start gap-3 md:col-span-3">
                                <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                                <div className="space-y-1 w-full">
                                    <p className="font-medium text-muted-foreground">Comentario / Observación</p>
                                    <Textarea readOnly value={selectedCampaign.comment || 'Sin comentarios.'} className="mt-1 h-auto bg-transparent" />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingCampaign} onOpenChange={(isOpen) => !isOpen && setDeletingCampaign(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de que desea eliminar este análisis?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Está a punto de eliminar el análisis para <span className="font-bold">"{deletingCampaign?.name}"</span>. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    