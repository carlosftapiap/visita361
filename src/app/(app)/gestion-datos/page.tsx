
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Database, AlertTriangle, Loader2, RefreshCw, Calendar, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Visit } from '@/types';
import { getVisits } from '@/services/visitService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import { Badge } from '@/components/ui/badge';
import KpiCard from '@/components/kpi-card';
import { materialsList } from '@/lib/materials';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GestionDatosPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getVisits({}); // Fetch all visits without filters
            setVisits(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error desconocido.");
            toast({
                variant: "destructive",
                title: "Error al Cargar Datos",
                description: "No se pudieron obtener los datos. Por favor, reintente más tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { loadedMonths, loadedExecutives, materialSummary } = useMemo(() => {
        if (!visits || visits.length === 0) return { loadedMonths: [], loadedExecutives: [], materialSummary: {} };

        const monthSet = new Set<string>();
        visits.forEach(visit => {
            monthSet.add(format(new Date(visit['FECHA']), 'yyyy-MM'));
        });
        const sortedMonths = Array.from(monthSet)
            .sort((a, b) => b.localeCompare(a))
            .map(m => capitalize(format(new Date(m + '-02'), 'MMMM yyyy', { locale: es })));
        
        const executiveSet = new Set<string>();
        visits.forEach(visit => {
            if (visit['EJECUTIVA DE TRADE']) {
                executiveSet.add(visit['EJECUTIVA DE TRADE']);
            }
        });

        const summary: Record<string, number> = {};
        materialsList.forEach(m => summary[m] = 0);

        visits.forEach(visit => {
            if (visit['MATERIAL POP']) {
                for (const [material, quantity] of Object.entries(visit['MATERIAL POP'])) {
                    if (summary.hasOwnProperty(material)) {
                        summary[material] += quantity;
                    }
                }
            }
        });

        return { 
            loadedMonths: sortedMonths, 
            loadedExecutives: Array.from(executiveSet).sort(),
            materialSummary: summary 
        };
    }, [visits]);

    const renderContent = () => {
        if (loading) {
            return <DashboardSkeleton />;
        }
        if (error) {
            return (
                <Card className="shadow-md border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-destructive flex items-center gap-2">
                            <AlertTriangle /> Error de Conexión
                        </CardTitle>
                        <CardDescription className="text-destructive/90">
                            No se pudieron cargar los datos de las visitas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap font-code border">
                            {error}
                        </pre>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={fetchData} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Reintentar
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calendar className="text-primary"/> Meses Cargados</CardTitle>
                            <CardDescription>Lista de todos los meses que tienen al menos una actividad registrada.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadedMonths.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {loadedMonths.map(month => <Badge key={month} variant="secondary">{month}</Badge>)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay datos de meses cargados.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Ejecutivas con Actividad</CardTitle>
                            <CardDescription>Lista de todas las ejecutivas de trade con actividades registradas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadedExecutives.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {loadedExecutives.map(exec => <Badge key={exec} variant="secondary">{exec}</Badge>)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay datos de ejecutivas.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><Package /> Resumen de Materiales POP</CardTitle>
                        <CardDescription>Suma total de cada tipo de material utilizado en todas las actividades.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Object.entries(materialSummary).map(([name, total]) => (
                                <Card key={name} className="flex flex-col items-center justify-center p-4 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">{name}</p>
                                    <p className="text-2xl font-bold font-headline text-primary">{total.toLocaleString('es-CO')}</p>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Database /> Gestión de Datos
                    </h1>
                    <p className="text-muted-foreground">Información general sobre los datos cargados en el sistema.</p>
                </div>
            </div>
            
            {renderContent()}
        </div>
    );
}
