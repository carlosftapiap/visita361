
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Plus, Loader2, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, BadgePercent } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { RoiCampaign } from '@/types';
import { getRoiCampaigns, addRoiCampaign, deleteRoiCampaign } from '@/services/roiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DashboardSkeleton from '@/components/dashboard-skeleton';
import KpiCard from '@/components/kpi-card';
import { cn } from '@/lib/utils';

const campaignSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  start_date: z.date({ required_error: 'La fecha de inicio es requerida.' }),
  end_date: z.date({ required_error: 'La fecha de fin es requerida.' }),
  zone: z.string().min(1, { message: 'La zona es requerida.' }),
  responsible: z.string().min(1, { message: 'El responsable es requerido.' }),
  investment_type: z.string().min(1, { message: 'El tipo de inversión es requerido.' }),
  amount_invested: z.coerce.number().positive({ message: 'La inversión debe ser un número positivo.' }),
  revenue_generated: z.coerce.number().min(0, { message: 'Los ingresos no pueden ser negativos.' }),
  units_sold: z.coerce.number().min(0).optional(),
  comment: z.string().optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["end_date"],
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function AnalisisRoiPage() {
    const [campaigns, setCampaigns] = useState<RoiCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deletingCampaign, setDeletingCampaign] = useState<RoiCampaign | null>(null);
    const { toast } = useToast();

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRoiCampaigns();
            setCampaigns(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({ variant: "destructive", title: "Error al cargar campañas", description: "No se pudieron obtener los datos." });
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
            start_date: new Date(),
            end_date: new Date(),
            zone: '',
            responsible: '',
            investment_type: '',
            amount_invested: 0,
            revenue_generated: 0,
            units_sold: 0,
            comment: ''
        }
    });

    const calculatedResult = useMemo(() => {
        const invested = form.watch('amount_invested');
        const revenue = form.watch('revenue_generated');
        const units = form.watch('units_sold');

        if (invested <= 0) return null;
        if (revenue < 0) return null;
        
        const roi = ((revenue - invested) / invested) * 100;
        let status: 'Positivo' | 'Negativo' | 'Punto de Equilibrio' = 'Punto de Equilibrio';
        if (roi > 30) status = 'Positivo';
        if (roi < 0) status = 'Negativo';

        const ticket = (units && units > 0) ? (revenue / units) : 0;

        return {
            roi: roi.toFixed(2),
            status,
            ticket: ticket.toFixed(2)
        };
    }, [form.watch('amount_invested'), form.watch('revenue_generated'), form.watch('units_sold')]);

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
        if (error) return (
             <Card className="shadow-md border-destructive bg-destructive/5">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2"><AlertTriangle /> Error</CardTitle>
                    <CardDescription className="text-destructive/90">No se pudieron cargar los análisis de ROI. Revisa el mensaje.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">{error}</pre>
                </CardContent>
            </Card>
        );

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
                                    <TableHead>ROI (%)</TableHead>
                                    <TableHead>Invertido</TableHead>
                                    <TableHead>Ingresos</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.length > 0 ? (
                                    campaigns.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell className={cn(
                                                "font-bold",
                                                c.roi > 30 && "text-green-600",
                                                c.roi < 0 && "text-red-600"
                                            )}>{c.roi.toFixed(2)}%</TableCell>
                                            <TableCell>{c.amount_invested.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell>{c.revenue_generated.toLocaleString('es-CO', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell>{c.responsible}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingCampaign(c)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No hay campañas registradas. ¡Añada la primera!</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
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
                                        <FormField control={form.control} name="responsible" render={({ field }) => (<FormItem><FormLabel>Responsable</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel>Fecha de inicio</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{format(field.value, "PPP", { locale: es })}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel>Fecha de fin</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{format(field.value, "PPP", { locale: es })}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="zone" render={({ field }) => (<FormItem><FormLabel>Zona / Región</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Costa Norte">Costa Norte</SelectItem><SelectItem value="Costa Sur">Costa Sur</SelectItem><SelectItem value="Sierra">Sierra</SelectItem><SelectItem value="Oriente">Oriente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="investment_type" render={({ field }) => (<FormItem><FormLabel>Tipo de inversión</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Publicidad">Publicidad</SelectItem><SelectItem value="Muestras">Muestras</SelectItem><SelectItem value="Promocion en PDV">Promoción en PDV</SelectItem><SelectItem value="Capacitacion">Capacitación</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="amount_invested" render={({ field }) => (<FormItem><FormLabel>Monto invertido (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="revenue_generated" render={({ field }) => (<FormItem><FormLabel>Ingresos generados (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="units_sold" render={({ field }) => (<FormItem><FormLabel>Unidades vendidas</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="comment" render={({ field }) => (<FormItem><FormLabel>Comentario / Observación</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="md:col-span-1 space-y-4">
                                    <Card className="bg-muted/30">
                                        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {!calculatedResult && <p className="text-sm text-muted-foreground">Ingrese los montos para ver los resultados.</p>}
                                            {calculatedResult && (
                                                <>
                                                    <KpiCard icon={BadgePercent} title="ROI" value={`${calculatedResult.roi}%`} />
                                                    <KpiCard icon={calculatedResult.status === 'Negativo' ? TrendingDown : TrendingUp} title="Estado" value={calculatedResult.status} />
                                                    <KpiCard icon={DollarSign} title="Ticket Promedio" value={calculatedResult.ticket > 0 ? `$${calculatedResult.ticket}` : 'N/A'} />
                                                </>
                                            )}
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

