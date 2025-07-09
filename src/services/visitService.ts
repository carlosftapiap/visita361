
import { getSupabase } from '@/lib/supabase';
import type { Visit } from '@/types';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const buildSupabaseError = (error: any, context: string): Error => {
    console.error(`Error with Supabase ${context}:`, error);
    let message;

    if (error?.code === '42P01' || (error?.message && (error.message.includes('does not exist') || error.message.includes('no existe la relación')))) {
        message = `La tabla 'visits' no se encontró en Supabase o le faltan columnas.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `Ve al editor de SQL en tu dashboard de Supabase (Database -> SQL Editor) y ejecuta el siguiente comando para crear o actualizar la tabla:\n\n` +
                  `-- INICIA SCRIPT SQL --\n` +
                  `DROP TABLE IF EXISTS public.visits;\n\n`+
                  `CREATE TABLE public.visits (\n` +
                  `  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n` +
                  `  "EJECUTIVA DE TRADE" TEXT,\n` +
                  `  "ASESOR COMERCIAL" TEXT,\n` +
                  `  "CANAL" TEXT,\n` +
                  `  "CADENA" TEXT,\n` +
                  `  "DIRECCIÓN DEL PDV" TEXT,\n` +
                  `  "ACTIVIDAD" TEXT,\n` +
                  `  "HORARIO" TEXT,\n` +
                  `  "CIUDAD" TEXT,\n` +
                  `  "ZONA" TEXT,\n` +
                  `  "FECHA" TIMESTAMPTZ,\n` +
                  `  "PRESUPUESTO" NUMERIC,\n` +
                  `  "AFLUENCIA ESPERADA" INTEGER,\n` +
                  `  "FECHA DE ENTREGA DE MATERIAL" TIMESTAMPTZ,\n` +
                  `  "OBJETIVO DE LA ACTIVIDAD" TEXT,\n` +
                  `  "CANTIDAD DE MUESTRAS" INTEGER,\n` +
                  `  "MATERIAL POP" TEXT[],\n` +
                  `  "OBSERVACION" TEXT\n` +
                  `);\n` +
                  `-- FIN SCRIPT SQL --`;
    } else if (error?.code === '42501') { // permission denied
        message = `Error de Permisos en Supabase (Row Level Security).\n\n` +
                  `La política de seguridad de la tabla 'visits' no permite la operación de '${context}'.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `1. Asegúrate que RLS está habilitado para la tabla 'visits' (Authentication -> Policies).\n` +
                  `2. Crea una política que permita el acceso. Para desarrollo, puedes usar la siguiente en el editor SQL:\n\n` +
                  `-- INICIA SCRIPT SQL --\n` +
                  `DROP POLICY IF EXISTS "Public full access" ON public.visits;\n` +
                  `CREATE POLICY "Public full access" ON public.visits\n` +
                  `FOR ALL\n` +
                  `TO authenticated\n` +
                  `USING (true)\n` +
                  `WITH CHECK (true);\n` +
                  `-- FIN SCRIPT SQL --\n\n` +
                  `**NOTA:** Esta política da acceso total a usuarios autenticados. Para producción, debes crear reglas más restrictivas.`;
    } else {
        const errorMessage = error?.message || JSON.stringify(error, null, 2);
        message = `Ocurrió un error en la operación de ${context} con Supabase.\n\n` +
                  `**Detalles Técnicos:**\n` +
                  `Código: ${error?.code || 'N/A'}\n` +
                  `Mensaje: ${errorMessage}`;
    }

    return new Error(message);
}

export const getVisits = async (): Promise<Visit[]> => {
    const supabase = getSupabase();
    const threeMonthsAgo = subMonths(new Date(), 3);

    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('"FECHA"', threeMonthsAgo.toISOString())
        .order('"FECHA"', { ascending: false });

    if (error) {
        throw buildSupabaseError(error, 'lectura (getVisits)');
    }

    return data || [];
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').insert([visit]);

    if (error) {
        throw buildSupabaseError(error, 'creación (addVisit)');
    }
};

export const updateVisit = async (id: string, visit: Partial<Omit<Visit, 'id'>>) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').update(visit).eq('id', id);

    if (error) {
       throw buildSupabaseError(error, 'actualización (updateVisit)');
    }
};

export const addBatchVisits = async (visits: Omit<Visit, 'id'>[]) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').insert(visits);
    
    if (error) {
        throw buildSupabaseError(error, 'creación en lote (addBatchVisits)');
    }
};

export const deleteAllVisits = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').delete().neq('id', '-1');
    
    if (error) {
       throw buildSupabaseError(error, 'borrado total (deleteAllVisits)');
    }
};

export const deleteVisitsInMonths = async (months: string[]) => {
    const supabase = getSupabase();
    
    const filters = months.map(monthStr => {
        const dateInMonth = new Date(monthStr + '-02T12:00:00Z');
        const startDate = startOfMonth(dateInMonth).toISOString();
        const endDate = endOfMonth(dateInMonth).toISOString();
        return `and("FECHA".gte.${startDate},"FECHA".lte.${endDate})`;
    }).join(',');

    const { error } = await supabase
        .from('visits')
        .delete()
        .or(filters);

    if (error) {
       throw buildSupabaseError(error, 'borrado por meses (deleteVisitsInMonths)');
    }
};
