
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface ModulePlaceholderProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onDownloadTemplate: () => void;
}

export default function ModulePlaceholder({ title, description, icon: Icon, onDownloadTemplate }: ModulePlaceholderProps) {
    return (
        <div className="p-4 md:p-6">
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 text-center min-h-[60vh]">
                     <h3 className="text-xl font-semibold text-muted-foreground">Módulo en Construcción</h3>
                     <p className="max-w-md text-muted-foreground">
                        Esta sección estará disponible próximamente. Actualmente, puedes descargar la plantilla de ejemplo para familiarizarte con el formato de datos que se requerirá.
                     </p>
                    <Button variant="outline" onClick={onDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Plantilla de Ejemplo
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
