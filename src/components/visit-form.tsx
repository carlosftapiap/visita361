
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
import { materialsList } from '@/lib/materials';

const materialPopSchema = z.record(z.string(), z.coerce.number().min(0).optional());

const visitSchema = z.object({
  'EJECUTIVA DE TRADE': z.string().min(1, 'La ejecutiva es requerida.'),
  'ASESOR COMERCIAL': z.string().min(1, 'El asesor es requerido.'),
  'CANAL': z.string().min(1, 'El canal es requerido.'),
  'CADENA': z.string().min(1, 'La cadena es requerida.'),
  'DIRECCIÓN DEL PDV': z.string().min(1, 'La dirección del PDV es requerida.'),
  'ACTIVIDAD': z.enum(['Visita', 'IMPULSACIÓN', 'Verificación', 'Libre'], {
    required_error: 'Debe seleccionar una actividad.',
  }),
  'HORARIO': z.string().min(1, 'El horario es requerido.'),
  'CIUDAD': z.string().min(1, 'La ciudad es requerida.'),
  'ZONA': z.string().min(1, 'La zona es requerida.'),
  'FECHA': z.date({
    required_error: 'La fecha es requerida.',
  }).or(z.string().min(1, "La fecha es requerida.")),
  'PRESUPUESTO': z.coerce.number().min(0, 'El presupuesto no puede ser negativo.').default(0),
  'AFLUENCIA ESPERADA': z.coerce.number().min(0).optional(),
  'FECHA DE ENTREGA DE MATERIAL': z.date().optional().or(z.string().optional()),
  'OBJETIVO DE LA ACTIVIDAD': z.string().optional(),
  'CANTIDAD DE MUESTRAS': z.coerce.number().min(0).optional(),
  'MATERIAL POP': materialPopSchema.optional(),
  'OBSERVACION': z.string().optional(),
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
  });

  useEffect(() => {
    if (isOpen) {
      if (visit) {
        form.reset({
          ...visit,
          'FECHA': visit['FECHA'] ? new Date(visit['FECHA']) : new Date(),
          'FECHA DE ENTREGA DE MATERIAL': visit['FECHA DE ENTREGA DE MATERIAL'] ? new Date(visit['FECHA DE ENTREGA DE MATERIAL']) : undefined,
          'MATERIAL POP': visit['MATERIAL POP'] || {},
        });
      } else {
        const initialMaterials: Record<string, number> = {};
        materialsList.forEach(m => initialMaterials[m] = 0);
        form.reset({
          'EJECUTIVA DE TRADE': '',
          'ASESOR COMERCIAL': '',
          'CANAL': '',
          'CADENA': '',
          'DIRECCIÓN DEL PDV': '',
          'ACTIVIDAD': undefined,
          'HORARIO': '',
          'CIUDAD': '',
          'ZONA': '',
          'FECHA': new Date(),
          'PRESUPUESTO': 0,
          'AFLUENCIA ESPERADA': undefined,
          'FECHA DE ENTREGA DE MATERIAL': undefined,
          'OBJETIVO DE LA ACTIVIDAD': '',
          'CANTIDAD DE MUESTRAS': undefined,
          'MATERIAL POP': initialMaterials,
          'OBSERVACION': '',
        });
      }
    }
  }, [isOpen, visit, form]);

  const onSubmit = (data: VisitFormValues) => {
    try {
        const cleanMaterials: Record<string, number> = {};
        if (data['MATERIAL POP']) {
            for (const [key, value] of Object.entries(data['MATERIAL POP'])) {
                if (value && Number(value) > 0) {
                    cleanMaterials[key] = Number(value);
                }
            }
        }

        const visitToSave: any = {
            ...data,
            id: visit?.id || `manual-${Date.now()}`,
            'FECHA': data['FECHA'] instanceof Date ? data['FECHA'].toISOString() : data['FECHA'],
            'FECHA DE ENTREGA DE MATERIAL': data['FECHA DE ENTREGA DE MATERIAL'] instanceof Date ? data['FECHA DE ENTREGA DE MATERIAL'].toISOString() : data['FECHA DE ENTREGA DE MATERIAL'],
            'MATERIAL POP': cleanMaterials,
        };
        onSave(visitToSave);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fila 1 */}
              <FormField control={form.control} name="EJECUTIVA DE TRADE" render={({ field }) => ( <FormItem><FormLabel>Ejecutiva de Trade</FormLabel><FormControl><Input placeholder="Nombre de la ejecutiva" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="ASESOR COMERCIAL" render={({ field }) => ( <FormItem><FormLabel>Asesor Comercial</FormLabel><FormControl><Input placeholder="Nombre del asesor" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="FECHA" render={({ field }) => ( <FormItem className="flex flex-col pt-2"><FormLabel>Fecha de Visita</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(new Date(field.value), "PPP", { locale: es })) : (<span>Seleccione una fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              
              {/* Fila 2 */}
              <FormField control={form.control} name="CANAL" render={({ field }) => ( <FormItem><FormLabel>Canal</FormLabel><FormControl><Input placeholder="Ej: Moderno" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="CADENA" render={({ field }) => ( <FormItem><FormLabel>Cadena</FormLabel><FormControl><Input placeholder="Ej: Éxito" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="DIRECCIÓN DEL PDV" render={({ field }) => ( <FormItem><FormLabel>Dirección del PDV</FormLabel><FormControl><Input placeholder="Ej: Av. Siempreviva 123" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              {/* Fila 3 */}
              <FormField control={form.control} name="CIUDAD" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Ej: Bogotá" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="ZONA" render={({ field }) => ( <FormItem><FormLabel>Zona</FormLabel><FormControl><Input placeholder="Ej: Norte" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="HORARIO" render={({ field }) => ( <FormItem><FormLabel>Horario</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un horario" /></SelectTrigger></FormControl><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem><SelectItem value="Todo el día">Todo el día</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
              
              {/* Fila 4 */}
              <FormField control={form.control} name="ACTIVIDAD" render={({ field }) => ( <FormItem><FormLabel>Actividad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una actividad" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Visita">Visita</SelectItem><SelectItem value="IMPULSACIÓN">IMPULSACIÓN</SelectItem><SelectItem value="Verificación">Verificación</SelectItem><SelectItem value="Libre">Libre</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="PRESUPUESTO" render={({ field }) => ( <FormItem><FormLabel>Presupuesto</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="AFLUENCIA ESPERADA" render={({ field }) => ( <FormItem><FormLabel>Afluencia Esperada</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>

              {/* Fila 5 */}
              <FormField control={form.control} name="FECHA DE ENTREGA DE MATERIAL" render={({ field }) => ( <FormItem className="flex flex-col pt-2"><FormLabel>Fecha Entrega Material</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(new Date(field.value), "PPP", { locale: es })) : (<span>Seleccione una fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="CANTIDAD DE MUESTRAS" render={({ field }) => ( <FormItem><FormLabel>Cantidad de Muestras</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>

            {/* Fila 6 - Material POP */}
            <div className="space-y-4">
                <FormLabel className="text-base font-semibold">Material POP</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                    {materialsList.map((item) => (
                        <FormField
                            key={item}
                            control={form.control}
                            name={`MATERIAL POP.${item}`}
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormLabel className="w-2/3 font-normal">{item}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            className="w-1/3"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                            value={field.value || 0}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
            </div>


            {/* Fila 7 */}
            <div className="space-y-6">
              <FormField control={form.control} name="OBJETIVO DE LA ACTIVIDAD" render={({ field }) => ( <FormItem><FormLabel>Objetivo de la Actividad</FormLabel><FormControl><Textarea placeholder="Describa el objetivo de la actividad" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="OBSERVACION" render={({ field }) => ( <FormItem><FormLabel>Observación</FormLabel><FormControl><Textarea placeholder="Añada observaciones adicionales" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
             <DialogFooter className="pt-4">
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
