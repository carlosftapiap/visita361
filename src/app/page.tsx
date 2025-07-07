"use client";

import { useState } from 'react';
import { FileUp } from 'lucide-react';
import type { Visit } from '@/types';
import FileUploader from '@/components/file-uploader';
import Dashboard from '@/components/dashboard';
import { Button } from '@/components/ui/button';

// Mock data to simulate processed Excel file
const mockVisits: Visit[] = [
  { id: '1', agent: 'Ana Gomez', client: 'Supermercado Exito', city: 'Bogotá', date: new Date('2024-07-20'), activity: 'Visita', observations: 'Verificación de stock.' },
  { id: '2', agent: 'Ana Gomez', client: 'Tienda La Esquina', city: 'Bogotá', date: new Date('2024-07-21'), activity: 'Impulso', observations: 'Promoción nuevo producto.' },
  { id: '3', agent: 'Carlos Ruiz', client: 'Droguería La Rebaja', city: 'Medellín', date: new Date('2024-07-20'), activity: 'Visita', observations: 'Revisión de exhibición.' },
  { id: '4', agent: 'Beatriz Peña', client: 'Almacenes Jumbo', city: 'Cali', date: new Date('2024-07-22'), activity: 'Verificación', observations: 'Chequeo de precios.' },
  { id: '5', agent: 'Carlos Ruiz', client: 'Supermercado Carulla', city: 'Medellín', date: new Date('2024-07-22'), activity: 'Visita', observations: 'Reposición de producto.' },
  { id: '6', agent: 'Ana Gomez', client: 'Olímpica', city: 'Bogotá', date: new Date('2024-07-23'), activity: 'Visita', observations: 'Negociación de espacio.' },
  { id: '7', agent: 'David Luna', client: 'Makro', city: 'Barranquilla', date: new Date('2024-07-21'), activity: 'Impulso', observations: 'Evento de degustación.' },
  { id: '8', agent: 'Carlos Ruiz', client: 'Supermercado La Vaquita', city: 'Medellín', date: new Date('2024-07-24'), activity: 'Verificación', observations: 'Auditoría de planograma.' },
  { id: '9', agent: 'Ana Gomez', client: 'Tienda D1', city: 'Bogotá', date: new Date('2024-07-24'), activity: 'Visita', observations: 'Chequeo de inventario.' },
  { id: '10', agent: 'Beatriz Peña', client: 'La 14', city: 'Cali', date: new Date('2024-07-23'), activity: 'Impulso', observations: 'Entrega de material POP.' },
  { id: '11', agent: 'David Luna', client: 'Ara', city: 'Barranquilla', date: new Date('2024-07-23'), activity: 'Visita', observations: 'Revisión de stock.' },
  { id: '12', agent: 'Ana Gomez', client: 'Supermercado Exito', city: 'Bogotá', date: new Date('2024-07-25'), activity: 'Verificación', observations: 'Control de precios.' },
  { id: '13', agent: 'Carlos Ruiz', client: 'Droguería La Rebaja', city: 'Medellín', date: new Date('2024-07-25'), activity: 'Impulso', observations: 'Impulso de nueva línea.' },
  { id: '14', agent: 'Beatriz Peña', client: 'Almacenes Jumbo', city: 'Cali', date: new Date('2024-07-25'), activity: 'Visita', observations: 'Revisión de góndola.' },
];

export default function Home() {
  const [data, setData] = useState<Visit[] | null>(null);

  const handleDataProcessed = (processedData: Visit[]) => {
    setData(processedData);
  };

  const handleReset = () => {
    setData(null);
  }

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
        {data && (
            <Button onClick={handleReset} >
                <FileUp className="mr-2 h-4 w-4" />
                Cargar otro archivo
            </Button>
        )}
      </header>

      <main className="flex-1 p-4 md:p-6">
        {data ? (
          <Dashboard data={data} />
        ) : (
          <div className="mx-auto mt-10 max-w-4xl">
            <FileUploader onDataProcessed={handleDataProcessed} mockData={mockVisits} />
          </div>
        )}
      </main>
    </div>
  );
}
