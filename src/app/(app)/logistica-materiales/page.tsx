
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Truck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import type { Visit, Material, VisitMaterial } from '@/types';
import { getVisits, getMaterials, getVisitMaterials } from '@/services/visitService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import LogisticsDashboard from '@/components/logistics-dashboard';

export default function LogisticaMaterialesPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [visitMaterials, setVisitMaterials] = useState<VisitMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [visitsData, materialsData, visitMaterialsData] = await Promise.all([
                getVisits(),
                getMaterials(),
                getVisitMaterials()
            ]);
            
            setVisits(visitsData);
            setMaterials(materialsData);
            setVisitMaterials(visitMaterialsData);

        } catch (err: any) {
            const errorMessage = err.message || "Ocurrió un error desconocido.";
            setError(errorMessage);
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
                           No se pudieron cargar los datos de logística. Revisa el mensaje de error.
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

        return <LogisticsDashboard visits={visits} materials={materials} visitMaterials={visitMaterials} />;
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
                        <Truck /> Logística de Materiales
                    </h1>
                    <p className="text-muted-foreground">Planifique y visualice los costos de material para actividades de impulsación.</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}
