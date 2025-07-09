"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Visit } from '@/types';
import { Textarea } from './ui/textarea';

const visitSchema = z.object({
  trade_executive: z.string().min(1, 'La ejecutiva es requerida.'),
  agent: z.string().min(1, 'El asesor es requerido.'),
  channel: z.string().min(1, 'El canal es requerido.'),
  chain: z.string().min(1, 'La cadena es requerida.'),
  pdv_detail: z.string().min(1, 'El detalle del PDV es requerido.'),
  activity: z.enum(['Visita', 'Impulso', 'Verificación'], {
    required_error: 'Debe seleccionar una actividad.',
  }),
  schedule: z.string().min(1, 'El horario es requerido.'),
  city: z.string().min(1, 'La ciudad es requerida.'),
  zone: z.string().min(1, 'La zona es requerida.'),
  date: z.date({
    required_error: 'La fecha es requerida.',
  }),
  budget: z.coerce.number().min(0, 'El presupuesto no puede ser negativo.').default(0),
  expected_people: z.coerce.number().min(0).optional(),
  material_delivery_date: z.date().optional(),
  delivery_place: z.string().optional(),
  objective: z.string().optional(),
  sample_count: z.coerce.number().min(0).optional(),
  material_pop: z.string().optional(),
  other_materials: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitSchema>;

interface VisitFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (visit: Visit) => void;
  visit?: Visit | null;
}

export default function VisitForm({ isOpen, onOpenChange, onSave, visit }: VisitFormProps) {
  const { toast } = useToast();
  
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
        trade_executive: '',
        agent: '',
        channel: '',
        chain: '',
        pdv_detail: '',
        activity: undefined,
        schedule: '',
        city: '',
        zone: '',
        date: undefined,
        budget: 0,
        expected_people: undefined,
        material_delivery_date: undefined,
        delivery_place: '',
        objective: '',
        sample_count: undefined,
        material_pop: '',
        other_materials: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (visit) {
        form.reset({
          ...visit
        });
      } else {
        form.reset({
          trade_executive: '',
          agent: '',
          channel: '',
          chain: '',
          pdv_detail: '',
          activity: undefined,
          schedule: '',
          city: '',
          zone: '',
          date: new Date(),
          budget: 0,
          expected_people: undefined,
          material_delivery_date: undefined,
          delivery_place: '',
          objective: '',
          sample_count: undefined,
          material_pop: '',
          other_materials: '',
        });
      }
    }
  }, [isOpen, visit, form]);

  const onSubmit = (data: VisitFormValues) => {
    try {
        const visitToSave: Visit = {
            ...data,
            id: visit?.id || `manual-${Date.now()}`,
        };
        onSave(visitToSave);
        toast({
            title: 'Éxito',
            description: `Visita ${visit ? 'actualizada' : 'creada'} correctamente.`,
        });
        onOpenChange(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar la visita.',
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{visit ? 'Editar Visita' : 'Añadir Nueva Visita'}</DialogTitle>
          <DialogDescription>
            {visit ? 'Modifique los detalles de la visita.' : 'Complete el formulario para registrar una nueva visita.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Fila 1 */}
            <FormField control={form.control} name="trade_executive" render={({ field }) => ( <FormItem><FormLabel>Ejecutiva de Trade</FormLabel><FormControl><Input placeholder="Nombre de la ejecutiva" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="agent" render={({ field }) => ( <FormItem><FormLabel>Asesor Comercial</FormLabel><FormControl><Input placeholder="Nombre del asesor" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col pt-2"><FormLabel>Fecha de Visita</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Seleccione una fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            
            {/* Fila 2 */}
            <FormField control={form.control} name="channel" render={({ field }) => ( <FormItem><FormLabel>Canal</FormLabel><FormControl><Input placeholder="Ej: Moderno" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="chain" render={({ field }) => ( <FormItem><FormLabel>Cadena</FormLabel><FormControl><Input placeholder="Ej: Éxito" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="pdv_detail" render={({ field }) => ( <FormItem><FormLabel>Detalle del PDV</FormLabel><FormControl><Input placeholder="Ej: Éxito Calle 80" {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            {/* Fila 3 */}
            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Ej: Bogotá" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="zone" render={({ field }) => ( <FormItem><FormLabel>Zona</FormLabel><FormControl><Input placeholder="Ej: Norte" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="schedule" render={({ field }) => ( <FormItem><FormLabel>Horario</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un horario" /></SelectTrigger></FormControl><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem><SelectItem value="Todo el día">Todo el día</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
            
            {/* Fila 4 */}
            <FormField control={form.control} name="activity" render={({ field }) => ( <FormItem><FormLabel>Actividad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una actividad" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Visita">Visita</SelectItem><SelectItem value="Impulso">Impulso</SelectItem><SelectItem value="Verificación">Verificación</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="budget" render={({ field }) => ( <FormItem><FormLabel>Presupuesto</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="expected_people" render={({ field }) => ( <FormItem><FormLabel>Afluencia Esperada</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>

            {/* Fila 5 */}
            <FormField control={form.control} name="material_delivery_date" render={({ field }) => ( <FormItem className="flex flex-col pt-2"><FormLabel>Fecha Entrega Material</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Seleccione una fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="delivery_place" render={({ field }) => ( <FormItem><FormLabel>Lugar de Entrega</FormLabel><FormControl><Input placeholder="Ej: Bodega Central" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="sample_count" render={({ field }) => ( <FormItem><FormLabel>Cantidad de Muestras</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            
            {/* Fila 6 */}
            <FormField control={form.control} name="material_pop" render={({ field }) => ( <FormItem><FormLabel>Material POP</FormLabel><FormControl><Textarea placeholder="Describa el material POP" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="other_materials" render={({ field }) => ( <FormItem><FormLabel>Otros Materiales</FormLabel><FormControl><Textarea placeholder="Describa otros materiales" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="objective" render={({ field }) => ( <FormItem><FormLabel>Objetivo</FormLabel><FormControl><Textarea placeholder="Describa el objetivo de la visita" {...field} /></FormControl><FormMessage /></FormItem> )}/>

             <DialogFooter className="md:col-span-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
