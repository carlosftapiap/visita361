
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Truck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import type { Visit, Material, VisitMaterial, VisitWithMaterials } from '@/types';
import { getVisits, getMaterials, getVisitMaterials } from '@/services/visitService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DashboardSkeleton from '@/components/dashboard-skeleton';
import LogisticsDashboard from '@/components/logistics-dashboard';

export default function LogisticaMaterialesPage() {
    const [logisticsData, setLogisticsData] = useState<VisitWithMaterials[]>([]);
    const [kpis, setKpis] = useState({ totalActivities: 0, totalCost: 0, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [visits, materials, visitMaterials] = await Promise.all([
                getVisits(),
                getMaterials(),
                getVisitMaterials()
            ]);

            const materialMap = new Map(materials.map(m => [m.id, m]));
            
            const impulseVisits = visits.filter(v => v.ACTIVIDAD === 'IMPULSACIÓN');

            const processedData: VisitWithMaterials[] = impulseVisits.map(visit => {
                const materialsForVisit = visitMaterials.filter(vm => vm.visit_id === visit.id);
                
                const materials_list = materialsForVisit.map(vm => {
                    const materialDetail = materialMap.get(vm.material_id);
                    return {
                        name: materialDetail?.name || 'Desconocido',
                        quantity: vm.quantity,
                        unit_price: materialDetail?.unit_price || 0,
                    };
                });

                const total_cost = materials_list.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
                
                return {
                    ...visit,
                    materials_list,
                    total_cost,
                };
            }).filter(v => v.materials_list.length > 0);

            const totalActivities = processedData.length;
            const totalCost = processedData.reduce((sum, visit) => sum + visit.total_cost, 0);
            const totalItems = processedData.reduce((sum, visit) => {
                return sum + visit.materials_list.reduce((itemSum, item) => itemSum + item.quantity, 0);
            }, 0);

            setLogisticsData(processedData);
            setKpis({ totalActivities, totalCost, totalItems });

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

        return <LogisticsDashboard logisticsData={logisticsData} kpis={kpis} />;
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
