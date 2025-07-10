
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function GrillaEjecucionMaterialesPage() {
    return (
        <div className="p-4 md:p-6">
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Truck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">Grilla de Ejecución de Materiales</CardTitle>
                            <CardDescription>Visualice la planificación y ejecución de entrega de materiales.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 text-center min-h-[60vh]">
                     <h3 className="text-xl font-semibold text-muted-foreground">Módulo en Construcción</h3>
                     <p className="max-w-md text-muted-foreground">
                        Esta sección estará disponible próximamente.
                     </p>
                </CardContent>
            </Card>
        </div>
    );
}
