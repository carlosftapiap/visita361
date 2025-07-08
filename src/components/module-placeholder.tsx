import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

interface ModulePlaceholderProps {
    title: string;
    description: string;
    icon: React.ElementType;
}

export default function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
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
                <CardContent className="flex flex-col items-center justify-center gap-6 text-center h-[60vh]">
                     <div
                        className="flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-primary/5"
                    >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <UploadCloud className="h-12 w-12 text-accent" />
                            <p className="mb-1">Arrastre y suelte o haga clic para cargar.</p>
                            <span className="text-xs">Módulo en construcción. La carga de archivos se habilitará próximamente.</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
