import { getSupabase } from '@/lib/supabase';
import type { Visit } from '@/types';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Supabase returns dates as ISO strings. This helper ensures they are Date objects.
const visitFromSupabase = (record: any): Visit => {
    const visit: Visit = {
        id: String(record.id),
        'EJECUTIVA DE TRADE': record['EJECUTIVA DE TRADE'],
        'ASESOR COMERCIAL': record['ASESOR COMERCIAL'],
        'CANAL': record['CANAL'],
        'CADENA': record['CADENA'],
        'DIRECCIÓN DEL PDV': record['DIRECCIÓN DEL PDV'],
        'ACTIVIDAD': record['ACTIVIDAD'],
        'HORARIO': record['HORARIO'],
        'CIUDAD': record['CIUDAD'],
        'ZONA': record['ZONA'],
        'FECHA': new Date(record['FECHA']),
        'PRESUPUESTO': record['PRESUPUESTO'],
        'AFLUENCIA ESPERADA': record['AFLUENCIA ESPERADA'],
        'FECHA DE ENTREGA DE MATERIAL': record['FECHA DE ENTREGA DE MATERIAL'] ? new Date(record['FECHA DE ENTREGA DE MATERIAL']) : undefined,
        'OBJETIVO DE LA ACTIVIDAD': record['OBJETIVO DE LA ACTIVIDAD'],
        'CANTIDAD DE MUESTRAS': record['CANTIDAD DE MUESTRAS'],
        'MATERIAL POP': record['MATERIAL POP'],
        'OBSERVACION': record['OBSERVACION'],
    };
    return visit;
};

const buildSupabaseError = (error: any, context: string): Error => {
    console.error(`Error with Supabase ${context}:`, error);
    let message;

    // It's common for the table to not exist, especially during setup.
    // The error code is '42P01' and the message contains 'relation "..." does not exist'.
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
                  `  "MATERIAL POP" TEXT,\n` +
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
                  `CREATE POLICY "Public full access" ON public.visits\n` +
                  `FOR ALL\n` +
                  `TO authenticated\n` +
                  `USING (true)\n` +
                  `WITH CHECK (true);\n` +
                  `-- FIN SCRIPT SQL --\n\n` +
                  `**NOTA:** Esta política da acceso total a usuarios autenticados. Para producción, debes crear reglas más restrictivas.`;
    } else {
        message = `Ocurrió un error inesperado en la operación de ${context} con Supabase.\n\n` +
                  `Asegúrate de que tus credenciales en el archivo .env.local son correctas y de que has reiniciado el servidor de desarrollo después de cualquier cambio.\n\n` +
                  `**Detalles Técnicos:**\n` +
                  `Código: ${error?.code || 'N/A'}\n` +
                  `Mensaje: ${error?.message || 'No hay un mensaje de error específico del servidor.'}`;
    }

    return new Error(message);
}

export const getVisits = async (): Promise<Visit[]> => {
    const supabase = getSupabase();
    // Fetch records from the last 3 months to keep it fast
    const threeMonthsAgo = subMonths(new Date(), 3);

    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('"FECHA"', threeMonthsAgo.toISOString())
        .order('"FECHA"', { ascending: false });

    if (error) {
        throw buildSupabaseError(error, 'lectura (getVisits)');
    }

    return data ? data.map(visitFromSupabase) : [];
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    const supabase = getSupabase();
    // Supabase auto-generates the ID, so we don't include it in the insert.
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
    // A safe way to delete all rows. We can match any row.
    const { error } = await supabase.from('visits').delete().neq('id', '-1'); // Assuming ID is never -1
    
    if (error) {
       throw buildSupabaseError(error, 'borrado total (deleteAllVisits)');
    }
};

export const deleteVisitsInMonths = async (months: string[]) => {
    const supabase = getSupabase();
    
    // Create an 'OR' filter for all date ranges.
    const filters = months.map(monthStr => {
        // Use a neutral day and time to avoid timezone issues.
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
