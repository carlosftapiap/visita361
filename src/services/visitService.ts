

/*
================================================================================
SCRIPT SQL PARA CONFIGURAR LA BASE DE DATOS EN SUPABASE
================================================================================
Copia y pega este script completo en el SQL Editor de tu proyecto de Supabase
para crear y configurar las tablas necesarias para la aplicación.
--------------------------------------------------------------------------------

-- ========= PASO 1: Eliminar tablas antiguas (si existen) para empezar de cero =========
-- Esto asegura que no haya conflictos con versiones anteriores.
DROP TABLE IF EXISTS public.roi_campaigns CASCADE;
DROP TABLE IF EXISTS public.visit_materials CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;


-- ========= PASO 2: Crear la tabla principal de VISITAS =========
-- Guarda la información general de cada visita.
CREATE TABLE public.visits (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "EJECUTIVA DE TRADE" TEXT,
  "ASESOR COMERCIAL" TEXT,
  "CANAL" TEXT,
  "CADENA" TEXT,
  "DIRECCIÓN DEL PDV" TEXT,
  "ACTIVIDAD" TEXT,
  "HORARIO" TEXT,
  "CIUDAD" TEXT,
  "ZONA" TEXT,
  "FECHA" TIMESTAMPTZ,
  "PRESUPUESTO" NUMERIC,
  "AFLUENCIA ESPERADA" INTEGER,
  "FECHA DE ENTREGA DE MATERIAL" TIMESTAMPTZ,
  "OBJETIVO DE LA ACTIVIDAD" TEXT,
  "CANTIDAD DE MUESTRAS" INTEGER,
  "OBSERVACION" TEXT
);

-- ========= PASO 3: Crear el catálogo de MATERIALES con sus precios =========
-- Aquí vivirán todos los materiales que puedes crear, editar y eliminar desde la app.
CREATE TABLE public.materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    unit_price NUMERIC NOT NULL DEFAULT 0
);

-- ========= PASO 4: Crear la tabla de enlace VISIT_MATERIALS =========
-- Esta tabla conecta las visitas con los materiales y almacena la cantidad usada en cada una.
CREATE TABLE public.visit_materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    visit_id BIGINT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    material_id BIGINT NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    UNIQUE(visit_id, material_id)
);

-- ========= PASO 5: Crear la tabla de ANÁLISIS DE ROI (versión con cliente y utilidad) =========
-- Almacena los datos y resultados de las campañas de marketing.
CREATE TABLE public.roi_campaigns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    zone TEXT NOT NULL,
    responsible TEXT NOT NULL,
    investment_type TEXT NOT NULL,
    amount_invested NUMERIC NOT NULL CHECK (amount_invested > 0),
    revenue_generated NUMERIC NOT NULL,
    profit_generated NUMERIC NOT NULL,
    units_sold INTEGER,
    comment TEXT,
    roi NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN amount_invested = 0 THEN 0
            ELSE (profit_generated / amount_invested) * 100
        END
    ) STORED
);


-- ========= PASO 6: Configurar la Seguridad a Nivel de Fila (RLS) =========
-- Habilitamos la seguridad en todas las tablas.
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_campaigns ENABLE ROW LEVEL SECURITY;

-- Creamos políticas que permiten a los usuarios autenticados interactuar con las tablas.
CREATE POLICY "Public full access on visits" ON public.visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK(true);
CREATE POLICY "Public full access on visit_materials" ON public.visit_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on roi_campaigns" ON public.roi_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ========= PASO 7: Insertar los datos iniciales =========
-- Materiales que aparecerán la primera vez.
INSERT INTO public.materials (name, unit_price) VALUES
    ('AFICHE', 1.50), ('CARPA', 150.00), ('EXHIBIDOR MADERA', 80.00), ('FUNDA', 0.50),
    ('GANCHOS', 0.25), ('HABLADORES ACRILICO', 5.00), ('PLUMA', 0.75), ('ROMPETRAFICO', 2.00),
    ('SERVILLETA', 0.10), ('OTROS', 0.00), ('FLAYER', 0.20), ('ROLL UP', 45.00),
    ('LLAVERO', 1.00), ('PORTAVASO', 0.30), ('STAND', 250.00), ('VIBRIN', 3.00),
    ('EXHIBIDOR ACRILICO', 60.00)
ON CONFLICT (name) DO NOTHING;

*/


import { getSupabase } from '@/lib/supabase';
import type { Material, Visit, VisitMaterial } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

const buildSupabaseError = (error: any, context: string): Error => {
    const errorMessage = typeof error === 'object' && error !== null 
        ? JSON.stringify(error, null, 2)
        : String(error);

    console.error(`Error with Supabase ${context}:`, errorMessage);

    let message;
    if (error?.message && error.message.includes('Could not find the function')) {
         message = `La función de base de datos que la aplicación necesita no existe.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `1. Copia el script SQL completo que está en los comentarios de 'src/services/visitService.ts'.\n` +
                  `2. Ve al 'SQL Editor' en tu dashboard de Supabase.\n` +
                  `3. Pega el script y haz clic en 'RUN'.\n\n` +
                  `Esto creará las tablas y funciones que la aplicación necesita para funcionar.`;
    } else if (error?.message && (error.message.includes('does not exist') || error.message.includes('no existe la relación'))) {
        message = `Una o más tablas ('visits', 'materials', 'visit_materials', 'roi_campaigns') no se encontraron en Supabase o les faltan columnas.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `Ve al editor de SQL en tu dashboard de Supabase y ejecuta el script de configuración que se encuentra en los comentarios del archivo 'src/services/visitService.ts'.`;
    } else if (error?.code === '42501') {
        message = `Error de Permisos en Supabase (Row Level Security).\n\n` +
                  `Una política de seguridad está bloqueando la operación de '${context}'.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `Asegúrate de que RLS esté habilitado y que existan políticas que permitan el acceso a usuarios autenticados. Puedes usar el script de configuración en 'src/services/visitService.ts' para aplicar las políticas de desarrollo recomendadas.`;
    } else {
        message = `Ocurrió un error en la operación de ${context} con Supabase.\n\n` +
                  `**Detalles Técnicos:**\n` +
                  `Código: ${error?.code || 'N/A'}\n` +
                  `Mensaje: ${error?.message || errorMessage}`;
    }
    return new Error(message);
};


export const getMaterials = async (): Promise<Material[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('materials').select('*').order('name');
    if (error) {
        throw buildSupabaseError(error, 'lectura de materiales (getMaterials)');
    }
    return data || [];
};

export const getVisits = async (): Promise<Visit[]> => {
    const supabase = getSupabase();
    const { data: visitsData, error } = await supabase
        .from('visits')
        .select(`
            *,
            visit_materials (
                quantity,
                materials (
                    name,
                    unit_price
                )
            )
        `)
        .limit(10000); // Set a high limit to fetch all records, adjust if needed

    if (error) {
        throw buildSupabaseError(error, 'lectura de visitas (getVisits)');
    }
    if (!visitsData) return [];
    
    // Transform data to include MATERIAL POP object and calculate total cost
    const transformedData = visitsData.map(visit => {
        const materialPop: Record<string, number> = {};
        let totalCost = 0;

        if (Array.isArray(visit.visit_materials)) {
            visit.visit_materials.forEach((vm: any) => {
                if (vm.materials?.name) {
                    const quantity = vm.quantity || 0;
                    const unit_price = vm.materials.unit_price || 0;
                    materialPop[vm.materials.name] = quantity;
                    totalCost += quantity * unit_price;
                }
            });
        }

        const { visit_materials, ...rest } = visit;
        return {
            ...rest,
            'MATERIAL POP': materialPop,
            'total_cost': totalCost
        } as Visit;
    });

    return transformedData;
};

export const getVisitMaterials = async (): Promise<VisitMaterial[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('visit_materials')
        .select('*');

    if (error) {
        throw buildSupabaseError(error, 'lectura de visit_materials (getVisitMaterials)');
    }
    return data || [];
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    const supabase = getSupabase();
    const { 'MATERIAL POP': materials, ...visitData } = visit;

    const { data: newVisit, error: visitError } = await supabase
        .from('visits')
        .insert(visitData as Partial<Visit>)
        .select('id')
        .single();

    if (visitError) {
        throw buildSupabaseError(visitError, 'creación de visita (addVisit)');
    }
    if (!newVisit || !materials || Object.keys(materials).length === 0) return;

    const allMaterials = await getMaterials();
    const materialMap = new Map(allMaterials.map(m => [m.name, m.id]));

    const visitMaterialsData = Object.entries(materials)
        .filter(([name, quantity]) => quantity > 0 && materialMap.has(name))
        .map(([name, quantity]) => ({
            visit_id: newVisit.id,
            material_id: materialMap.get(name)!,
            quantity: quantity,
        }));

    if (visitMaterialsData.length > 0) {
        const { error: materialsError } = await supabase.from('visit_materials').insert(visitMaterialsData);
        if (materialsError) {
            throw buildSupabaseError(materialsError, 'asignación de materiales (addVisit)');
        }
    }
};

export const updateVisit = async (id: number, visit: Partial<Omit<Visit, 'id'>>) => {
    const supabase = getSupabase();
    const { 'MATERIAL POP': materials, ...visitData } = visit;

    const { error: visitError } = await supabase.from('visits').update(visitData as Partial<Visit>).eq('id', id);
    if (visitError) {
       throw buildSupabaseError(visitError, 'actualización de visita (updateVisit)');
    }

    const { error: deleteError } = await supabase.from('visit_materials').delete().eq('visit_id', id);
    if (deleteError) {
        throw buildSupabaseError(deleteError, 'borrado de materiales antiguos (updateVisit)');
    }

    if (materials && Object.keys(materials).length > 0) {
        const allMaterials = await getMaterials();
        const materialMap = new Map(allMaterials.map(m => [m.name, m.id]));

        const visitMaterialsData = Object.entries(materials)
            .filter(([name, quantity]) => quantity > 0 && materialMap.has(name))
            .map(([name, quantity]) => ({
                visit_id: id,
                material_id: materialMap.get(name)!,
                quantity: quantity,
            }));

        if (visitMaterialsData.length > 0) {
            const { error: materialsError } = await supabase.from('visit_materials').insert(visitMaterialsData);
            if (materialsError) {
                throw buildSupabaseError(materialsError, 'reasignación de materiales (updateVisit)');
            }
        }
    }
};


export const addBatchVisits = async (visits: Omit<Visit, 'id'>[]) => {
    const supabase = getSupabase();
    
    const allMaterialsList = await getMaterials();
    const materialIdMap = new Map(allMaterialsList.map(m => [m.name, m.id]));

    for (const visit of visits) {
        const { 'MATERIAL POP': materials, total_cost, ...visitData } = visit;

        const { data: newVisit, error: visitError } = await supabase
            .from('visits')
            .insert(visitData as Partial<Visit>)
            .select('id')
            .single();
        
        if (visitError) {
            console.error(`Error adding visit for ${visitData['ASESOR COMERCIAL']}:`, visitError.message);
            continue; 
        }
        
        if (!newVisit) continue;

        if (materials && Object.keys(materials).length > 0) {
            const visitMaterialsToInsert = Object.entries(materials)
                .filter(([name, quantity]) => quantity > 0 && materialIdMap.has(name))
                .map(([name, quantity]) => ({
                    visit_id: newVisit.id,
                    material_id: materialIdMap.get(name)!,
                    quantity,
                }));

            if (visitMaterialsToInsert.length > 0) {
                const { error: materialsError } = await supabase
                    .from('visit_materials')
                    .insert(visitMaterialsToInsert);

                if (materialsError) {
                    console.error(`Error adding materials for visit ID ${newVisit.id}:`, materialsError);
                }
            }
        }
    }
};


export const deleteAllVisits = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').delete().neq('id', '-1'); 
    if (error) {
       throw buildSupabaseError(error, 'borrado total de visitas (deleteAllVisits)');
    }
};

export const deleteVisitsInMonthsForExecutives = async (executivesByMonth: Record<string, string[]>) => {
    const supabase = getSupabase();

    for (const monthStr in executivesByMonth) {
        const executives = executivesByMonth[monthStr];
        if (!executives || executives.length === 0) continue;

        const dateInMonth = new Date(monthStr + '-02T12:00:00Z');
        const startDate = startOfMonth(dateInMonth).toISOString();
        const endDate = endOfMonth(dateInMonth).toISOString();

        const { error } = await supabase
            .from('visits')
            .delete()
            .gte('FECHA', startDate)
            .lte('FECHA', endDate)
            .in('EJECUTIVA DE TRADE', executives);

        if (error) {
            throw buildSupabaseError(error, `borrado para mes ${monthStr} y ejecutivas (deleteVisitsInMonthsForExecutives)`);
        }
    }
};

export const addMaterial = async (material: Omit<Material, 'id'>) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('materials').insert(material);
    if (error) {
        throw buildSupabaseError(error, 'creación de material (addMaterial)');
    }
}

export const updateMaterial = async (id: number, material: Partial<Omit<Material, 'id'>>) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('materials').update(material).eq('id', id);
    if (error) {
        throw buildSupabaseError(error, 'actualización de material (updateMaterial)');
    }
}

export const deleteMaterial = async (id: number) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
        throw buildSupabaseError(error, 'eliminación de material (deleteMaterial)');
    }
}


    