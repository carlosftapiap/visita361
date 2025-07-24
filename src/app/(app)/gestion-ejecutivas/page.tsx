
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Plus, Loader2, Trash2, Pencil, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import type { Executive } from '@/types';
import { getExecutives, addExecutive, updateExecutive, deleteExecutive, uploadExecutivePhoto } from '@/services/executiveService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const executiveSchema = z.object({
    name: z.string().min(1, { message: "El nombre de la ejecutiva es requerido." }),
    photo_url: z.string().url({ message: "Por favor, ingrese una URL válida." }).or(z.literal('')).optional(),
});

type ExecutiveFormValues = z.infer<typeof executiveSchema>;

export default function GestionEjecutivasPage() {
    const [executives, setExecutives] = useState<Executive[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExecutive, setEditingExecutive] = useState<Executive | null>(null);
    const [deletingExecutive, setDeletingExecutive] = useState<Executive | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { toast } = useToast();

    const fetchExecutives = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExecutives();
            setExecutives(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al cargar ejecutivas",
                description: "No se pudieron obtener los datos. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchExecutives();
    }, [fetchExecutives]);
    
    const form = useForm<ExecutiveFormValues>({
        resolver: zodResolver(executiveSchema),
        defaultValues: {
            name: '',
            photo_url: ''
        }
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
        }
    };

    const handleFormSubmit = async (values: ExecutiveFormValues) => {
        let finalPhotoUrl = editingExecutive?.photo_url || '';

        if (selectedFile) {
            try {
                finalPhotoUrl = await uploadExecutivePhoto(selectedFile);
            } catch (uploadError: any) {
                toast({
                    variant: "destructive",
                    title: "Error al subir la imagen",
                    description: uploadError.message || "No se pudo subir la foto de perfil."
                });
                return;
            }
        }

        const executiveData = { ...values, photo_url: finalPhotoUrl };

        try {
            if (editingExecutive) {
                await updateExecutive(editingExecutive.id, { photo_url: finalPhotoUrl });
                toast({ title: "Ejecutiva actualizada", description: `"${values.name}" ha sido modificada.` });
            } else {
                await addExecutive(executiveData);
                toast({ title: "Ejecutiva añadida", description: `"${values.name}" ha sido creada.` });
            }
            setIsFormOpen(false);
            await fetchExecutives();
        } catch (err: any) {
             toast({
                variant: "destructive",
                title: "Error al guardar",
                description: err.message.includes('unique constraint') 
                    ? `La ejecutiva con nombre "${values.name}" ya existe.`
                    : "No se pudo guardar la ejecutiva."
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingExecutive) return;

        try {
            await deleteExecutive(deletingExecutive.id);
            toast({ title: "Ejecutiva eliminada", description: `"${deletingExecutive.name}" ha sido borrada.` });
            setDeletingExecutive(null);
            await fetchExecutives();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: "No se pudo eliminar la ejecutiva."
            });
             setDeletingExecutive(null);
        }
    }

    const openEditDialog = (executive: Executive) => {
        setEditingExecutive(executive);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        form.reset({
            name: executive.name,
            photo_url: executive.photo_url || ''
        });
        setIsFormOpen(true);
    }
    
    const openAddDialog = () => {
        setEditingExecutive(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        form.reset({ name: '', photo_url: '' });
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
                           No se pudieron cargar las ejecutivas. Esto puede ser porque la tabla 'executives' no existe. Ejecute el script SQL actualizado.
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
                    <CardTitle>Catálogo de Ejecutivas</CardTitle>
                    <CardDescription>
                        Administre las ejecutivas de trade y sus fotos de perfil.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-h-[65vh] overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead className="w-20">Foto</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>URL de la Foto</TableHead>
                                    <TableHead className="w-32 text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {executives.length > 0 ? (
                                    executives.map(exec => (
                                        <TableRow key={exec.id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarImage src={exec.photo_url || undefined} alt={exec.name} data-ai-hint="woman portrait" />
                                                    <AvatarFallback>{exec.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{exec.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs truncate max-w-xs">{exec.photo_url || 'No asignada'}</TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(exec)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Editar</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingExecutive(exec)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No hay ejecutivas. ¡Añada la primera!
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
                        <Users /> Gestión de Ejecutivas
                    </h1>
                    <p className="text-muted-foreground">Añada, edite o elimine las ejecutivas del sistema.</p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Ejecutiva
                </Button>
            </div>
            
            {renderContent()}

            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingExecutive(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingExecutive ? 'Editar Ejecutiva' : 'Añadir Nueva Ejecutiva'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Ejecutiva</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Ej: Carolina Caicedo" 
                                                {...field} 
                                                readOnly={!!editingExecutive}
                                                className={!!editingExecutive ? "bg-muted/50 cursor-not-allowed" : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Foto de Perfil</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif, image/bmp"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </FormControl>
                                <FormMessage />
                                {selectedFile && <p className="text-xs text-muted-foreground mt-1">Archivo seleccionado: {selectedFile.name}</p>}
                                {!selectedFile && editingExecutive?.photo_url && (
                                     <p className="text-xs text-muted-foreground mt-1">
                                        Foto actual: <a href={editingExecutive.photo_url} target="_blank" rel="noopener noreferrer" className="underline">{editingExecutive.photo_url.split('/').pop()}</a>
                                     </p>
                                )}
                            </FormItem>
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
            <AlertDialog open={!!deletingExecutive} onOpenChange={(isOpen) => !isOpen && setDeletingExecutive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de que desea eliminar esta ejecutiva?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Está a punto de eliminar a <span className="font-bold">"{deletingExecutive?.name}"</span>. 
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

    

    