
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Package, Plus, Loader2, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import type { Material } from '@/types';
import { getMaterials, addMaterial, updateMaterial, deleteMaterial } from '@/services/visitService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import DashboardSkeleton from '@/components/dashboard-skeleton';

const materialSchema = z.object({
    name: z.string().min(1, { message: "El nombre del material es requerido." }),
    unit_price: z.coerce.number().min(0, { message: "El precio debe ser un número positivo." })
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function GestionMaterialesPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

    const { toast } = useToast();

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMaterials();
            setMaterials(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al cargar materiales",
                description: "No se pudieron obtener los datos. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);
    
    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(materialSchema),
        defaultValues: {
            name: '',
            unit_price: 0
        }
    });

    const handleFormSubmit = async (values: MaterialFormValues) => {
        try {
            if (editingMaterial) {
                await updateMaterial(editingMaterial.id, values);
                toast({ title: "Material actualizado", description: `"${values.name}" ha sido modificado.` });
            } else {
                await addMaterial(values);
                toast({ title: "Material añadido", description: `"${values.name}" ha sido creado.` });
            }
            setIsFormOpen(false);
            setEditingMaterial(null);
            await fetchMaterials();
        } catch (err: any) {
             toast({
                variant: "destructive",
                title: "Error al guardar",
                description: err.message.includes('unique constraint') 
                    ? `El material con nombre "${values.name}" ya existe.`
                    : "No se pudo guardar el material."
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMaterial) return;

        try {
            await deleteMaterial(deletingMaterial.id);
            toast({ title: "Material eliminado", description: `"${deletingMaterial.name}" ha sido borrado.` });
            setDeletingMaterial(null);
            await fetchMaterials();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: err.message.includes('violates foreign key constraint')
                    ? `No se puede eliminar "${deletingMaterial.name}" porque está siendo usado en una o más visitas.`
                    : "No se pudo eliminar el material."
            });
             setDeletingMaterial(null);
        }
    }

    const openEditDialog = (material: Material) => {
        setEditingMaterial(material);
        form.reset({
            name: material.name,
            unit_price: material.unit_price
        });
        setIsFormOpen(true);
    }
    
    const openAddDialog = () => {
        setEditingMaterial(null);
        form.reset({ name: '', unit_price: 0 });
        setIsFormOpen(true);
    }

    const renderContent = () => {
        if (loading) {
            return <DashboardSkeleton />;
        }

        if (error) {
            return (
                <Card className="shadow-md border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                            <AlertTriangle /> Error de Carga
                        </CardTitle>
                        <CardDescription className="text-destructive/90">
                           No se pudieron cargar los materiales. Revisa el mensaje de error.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                            {error}
                        </pre>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Catálogo de Materiales</CardTitle>
                    <CardDescription>
                        Visualice, cree, edite y elimine los materiales POP disponibles en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-h-[65vh] overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Nombre del Material</TableHead>
                                    <TableHead className="w-48 text-right">Precio Unitario</TableHead>
                                    <TableHead className="w-32 text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.length > 0 ? (
                                    materials.map(material => (
                                        <TableRow key={material.id}>
                                            <TableCell className="font-medium">{material.name}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {material.unit_price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                            </TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(material)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Editar</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingMaterial(material)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No hay materiales. ¡Añada el primero!
                                        </TableCell>
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
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Package /> Gestión de Materiales
                    </h1>
                    <p className="text-muted-foreground">Administre el inventario y los costos de su material POP.</p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Material
                </Button>
            </div>
            
            {renderContent()}

            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingMaterial(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMaterial ? 'Editar Material' : 'Añadir Nuevo Material'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Material</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Rompetráfico" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Unitario</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!deletingMaterial} onOpenChange={(isOpen) => !isOpen && setDeletingMaterial(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de que desea eliminar este material?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Está a punto de eliminar el material <span className="font-bold">"{deletingMaterial?.name}"</span>. 
                           Esta acción no se puede deshacer.
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

    