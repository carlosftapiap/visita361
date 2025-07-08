"use client";

import { useState } from 'react';
import { Trash2, BarChart3, Plus } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import VisitForm from '@/components/visit-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [data, setData] = useState<Visit[] | null>(null);
  const [formState, setFormState] = useState<{ open: boolean; visit?: Visit | null }>({
    open: false,
    visit: null,
  });


  const handleDataProcessed = (processedData: Visit[]) => {
    setData(prevData => [...(prevData || []), ...processedData]);
  };

  const handleReset = () => {
    setData(null);
  }

  const handleSaveVisit = (visitToSave: Visit) => {
    setData(prevData => {
        const dataArr = prevData || [];
        const existingIndex = dataArr.findIndex(v => v.id === visitToSave.id);
        if (existingIndex > -1) {
            const newData = [...dataArr];
            newData[existingIndex] = visitToSave;
            return newData;
        } else {
            return [...dataArr, visitToSave];
        }
    });
    setFormState({ open: false, visit: null });
  };

  const handleEditVisit = (visit: Visit) => {
    setFormState({ open: true, visit });
  };

  const handleAddVisitClick = () => {
    setFormState({ open: true, visit: null });
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M4 4.00098H12.001L12.002 12.002L4 12.001L4 4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16.002H8.0005L8.001 20.0024H4V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.002 16.002H20.003L20.002 20.0024H12.002V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.002 4.00098H20.0024V8.00149H16.002V4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="font-headline text-2xl font-bold text-primary md:text-3xl">
            Visita360
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleAddVisitClick}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Visita
            </Button>
            {data && (
                <Button onClick={handleReset} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Datos
                </Button>
            )}
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4 md:p-6 lg:flex-row">
        <div className="w-full lg:w-96 lg:shrink-0">
          <FileUploader onDataProcessed={handleDataProcessed} />
        </div>
        <div className="flex-1">
          {data ? (
            <Dashboard data={data} onEditVisit={handleEditVisit} />
          ) : (
            <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <div className="rounded-full border-8 border-primary/10 bg-primary/5 p-6">
                        <BarChart3 className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="font-headline text-2xl">Esperando datos</h2>
                    <p className="max-w-xs text-muted-foreground">Cargue uno o más archivos de Excel para visualizar el panel de control consolidado.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <VisitForm
        isOpen={formState.open}
        onOpenChange={(isOpen) => setFormState({ ...formState, open: isOpen, visit: isOpen ? formState.visit : null })}
        visit={formState.visit}
        onSave={handleSaveVisit}
      />
    </div>
  );
}
