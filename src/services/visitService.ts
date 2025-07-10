
import { getSupabase } from '@/lib/supabase';
import type { Material, Visit, VisitWithMaterials } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

/*
================================================================================
SCRIPT SQL PARA CONFIGURAR LA BASE DE DATOS EN SUPABASE
================================================================================
Copia y pega este script completo en el SQL Editor de tu proyecto de Supabase
para crear y configurar las tablas y funciones necesarias para la aplicación.
--------------------------------------------------------------------------------

-- ========= PASO 1: Eliminar tablas antiguas (si existen) para empezar de cero =========
-- Esto asegura que no haya conflictos con versiones anteriores.
DROP TABLE IF EXISTS public.visit_materials;
DROP TABLE IF EXISTS public.materials;
DROP TABLE IF EXISTS public.visits;

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

-- ========= PASO 5: Configurar la Seguridad a Nivel de Fila (RLS) =========
-- Habilitamos la seguridad en las tres tablas.
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_materials ENABLE ROW LEVEL SECURITY;

-- Creamos políticas que permiten a los usuarios autenticados interactuar con las tablas.
CREATE POLICY "Public full access on visits" ON public.visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK(true);
CREATE POLICY "Public full access on visit_materials" ON public.visit_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========= PASO 6: Insertar los materiales iniciales en el catálogo =========
-- Estos son los materiales que aparecerán la primera vez. Puedes modificarlos desde la app.
INSERT INTO public.materials (name, unit_price) VALUES
    ('AFICHE', 1.50), ('CARPA', 150.00), ('EXHIBIDOR MADERA', 80.00), ('FUNDA', 0.50),
    ('GANCHOS', 0.25), ('HABLADORES ACRILICO', 5.00), ('PLUMA', 0.75), ('ROMPETRAFICO', 2.00),
    ('SERVILLETA', 0.10), ('OTROS', 0.00), ('FLAYER', 0.20), ('ROLL UP', 45.00),
    ('LLAVERO', 1.00), ('PORTAVASO', 0.30), ('STAND', 250.00), ('VIBRIN', 3.00),
    ('EXHIBIDOR ACRILICO', 60.00)
ON CONFLICT (name) DO NOTHING;

-- ========= PASO 7: Crear la función RPC para obtener los datos consolidados =========
-- !!IMPORTANTE!!: ESTA FUNCIÓN ES NECESARIA PARA LA PÁGINA DE "LOGÍSTICA DE MATERIALES".
-- Esta función une las tres tablas y pre-calcula los costos. Es la forma más robusta y eficiente
-- de obtener los datos para la aplicación.
CREATE OR REPLACE FUNCTION get_visits_with_materials_and_cost()
RETURNS TABLE(
    id BIGINT,
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
    "OBSERVACION" TEXT,
    visit_materials JSONB,
    total_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v."EJECUTIVA DE TRADE",
        v."ASESOR COMERCIAL",
        v."CANAL",
        v."CADENA",
        v."DIRECCIÓN DEL PDV",
        v."ACTIVIDAD",
        v."HORARIO",
        v."CIUDAD",
        v."ZONA",
        v."FECHA",
        v."PRESUPUESTO",
        v."AFLUENCIA ESPERADA",
        v."FECHA DE ENTREGA DE MATERIAL",
        v."OBJETIVO DE LA ACTIVIDAD",
        v."CANTIDAD DE MUESTRAS",
        v."OBSERVACION",
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'quantity', vm.quantity,
                    'materials', jsonb_build_object(
                        'id', m.id,
                        'name', m.name,
                        'unit_price', m.unit_price
                    )
                )
            ) FILTER (WHERE vm.id IS NOT NULL),
            '[]'::jsonb
        ) AS visit_materials,
        COALESCE(SUM(vm.quantity * m.unit_price), 0) AS total_cost
    FROM
        public.visits v
    LEFT JOIN
        public.visit_materials vm ON v.id = vm.visit_id
    LEFT JOIN
        public.materials m ON vm.material_id = m.id
    GROUP BY
        v.id
    ORDER BY
        v."FECHA" DESC;
END;
$$ LANGUAGE plpgsql;

*/


const buildSupabaseError = (error: any, context: string): Error => {
    const errorMessage = typeof error === 'object' && error !== null 
        ? JSON.stringify(error, null, 2)
        : String(error);

    console.error(`Error with Supabase ${context}:`, errorMessage);

    let message;
    if (error?.message && error.message.includes('Could not find the function')) {
        message = `La función de base de datos 'get_visits_with_materials_and_cost' no existe.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `1. Copia el script SQL completo que está en los comentarios de 'src/services/visitService.ts'.\n` +
                  `2. Ve al 'SQL Editor' en tu dashboard de Supabase.\n` +
                  `3. Pega el script y haz clic en 'RUN'.\n\n` +
                  `Esto creará la función que la aplicación necesita para funcionar.`;
    } else if (error?.message && (error.message.includes('does not exist') || error.message.includes('no existe la relación'))) {
        message = `Una o más tablas ('visits', 'materials', 'visit_materials') no se encontraron en Supabase o les faltan columnas.\n\n` +
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
                  `Mensaje: ${errorMessage}`;
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
    const { data, error } = await supabase
        .from('visits')
        .select(`
            *,
            visit_materials ( quantity, materials ( name, unit_price ) )
        `)
        .order('FECHA', { ascending: false });

    if (error) {
        throw buildSupabaseError(error, 'lectura de visitas (getVisits)');
    }
    if (!data) return [];

    return data.map((visit: any) => ({
        ...visit,
        'MATERIAL POP': (visit.visit_materials || []).reduce((acc: Record<string, number>, item: any) => {
            if (item.materials?.name) {
                acc[item.materials.name] = item.quantity;
            }
            return acc;
        }, {}),
    }));
};

export const getLogisticsData = async (): Promise<VisitWithMaterials[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_visits_with_materials_and_cost');

    if (error) {
        throw buildSupabaseError(error, 'lectura de datos de logística (getLogisticsData RPC)');
    }
    if (!data) {
        return [];
    }

    return data.map((visit: any) => ({
        ...visit,
        'MATERIAL POP': (visit.visit_materials || []).reduce((acc: Record<string, number>, item: any) => {
            if (item.materials?.name) {
                acc[item.materials.name] = item.quantity;
            }
            return acc;
        }, {})
    }));
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

    if (materials) {
        const { error: deleteError } = await supabase.from('visit_materials').delete().eq('visit_id', id);
        if (deleteError) {
            throw buildSupabaseError(deleteError, 'borrado de materiales antiguos (updateVisit)');
        }

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
    
    const allMaterials = await getMaterials();
    const materialIdMap = new Map(allMaterials.map(m => [m.name, m.id]));

    for (const visit of visits) {
        const { 'MATERIAL POP': materials, ...visitData } = visit;

        const { data: newVisit, error: visitError } = await supabase
            .from('visits')
            .insert(visitData as Partial<Visit>)
            .select('id')
            .single();

        if (visitError) {
            console.error(`Error adding visit for ${visitData['ASESOR COMERCIAL']}:`, visitError.message);
            // Optionally, throw the error to stop the whole batch
            // throw buildSupabaseError(visitError, `creación de visita en lote para ${visitData['ASESOR COMERCIAL']}`);
            continue; // Or continue with the next visit
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
    // Delete from visit_materials first due to foreign key constraints
    const { error: materialError } = await supabase.from('visit_materials').delete().neq('id', '-1');
    if (materialError) {
       throw buildSupabaseError(materialError, 'borrado total de materiales de visita (deleteAllVisits)');
    }
    const { error } = await supabase.from('visits').delete().neq('id', '-1');
    if (error) {
       throw buildSupabaseError(error, 'borrado total de visitas (deleteAllVisits)');
    }
};

export const deleteVisitsInMonths = async (months: string[]) => {
    const supabase = getSupabase();
    
    const filters = months.map(monthStr => {
        const dateInMonth = new Date(monthStr + '-02T12:00:00Z');
        const startDate = startOfMonth(dateInMonth).toISOString();
        const endDate = endOfMonth(dateInMonth).toISOString();
        return `and(FECHA.gte.${startDate},FECHA.lte.${endDate})`;
    }).join(',');

    // First, get the IDs of the visits to be deleted
    const { data: visitsToDelete, error: selectError } = await supabase
        .from('visits')
        .select('id')
        .or(filters);

    if (selectError) {
        throw buildSupabaseError(selectError, 'selección para borrado por meses (deleteVisitsInMonths)');
    }
    
    if (!visitsToDelete || visitsToDelete.length === 0) {
        return; // No visits to delete
    }

    const visitIds = visitsToDelete.map(v => v.id);

    // Delete from visit_materials first
    const { error: materialError } = await supabase
        .from('visit_materials')
        .delete()
        .in('visit_id', visitIds);

    if (materialError) {
        throw buildSupabaseError(materialError, 'borrado de materiales de visita por mes (deleteVisitsInMonths)');
    }

    // Then, delete the visits themselves
    const { error: deleteError } = await supabase
        .from('visits')
        .delete()
        .in('id', visitIds);

    if (deleteError) {
       throw buildSupabaseError(deleteError, 'borrado de visitas por mes (deleteVisitsInMonths)');
    }
};

// --- Material Management Functions ---

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
