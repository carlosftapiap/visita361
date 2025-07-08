import { getSupabase } from '@/lib/supabase';
import type { Visit } from '@/types';
import { subMonths } from 'date-fns';

// Supabase returns dates as ISO strings. This helper ensures they are Date objects.
const visitFromSupabase = (record: any): Visit => {
    return {
        ...record,
        id: String(record.id), // Ensure id is a string, as Supabase might return a number
        date: new Date(record.date),
    };
};

const buildSupabaseError = (error: any, context: string): Error => {
    console.error(`Error with Supabase ${context}:`, error);
    let message;

    if (error.code === '42P01') { // undefined table
        message = `La tabla 'visits' no se encontró en Supabase.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `Ve al editor de SQL en tu dashboard de Supabase (Database -> SQL Editor) y ejecuta el siguiente comando para crear la tabla:\n\n` +
                  `-- INICIA SCRIPT SQL --\n` +
                  `CREATE TABLE visits (\n` +
                  `  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n` +
                  `  trade_executive TEXT,\n` +
                  `  agent TEXT,\n` +
                  `  channel TEXT,\n` +
                  `  chain TEXT,\n` +
                  `  pdv_detail TEXT,\n` +
                  `  activity TEXT,\n` +
                  `  schedule TEXT,\n` +
                  `  city TEXT,\n` +
                  `  zone TEXT,\n` +
                  `  date TIMESTAMPTZ,\n` +
                  `  budget NUMERIC\n` +
                  `);\n` +
                  `-- FIN SCRIPT SQL --`;
    } else if (error.code === '42501') { // permission denied
        message = `Error de Permisos en Supabase (Row Level Security).\n\n` +
                  `La política de seguridad de la tabla 'visits' no permite la operación de '${context}'.\n\n` +
                  `**SOLUCIÓN:**\n` +
                  `1. Asegúrate que RLS está habilitado para la tabla 'visits' (Authentication -> Policies).\n` +
                  `2. Crea una política que permita el acceso. Para desarrollo, puedes usar la siguiente en el editor SQL:\n\n` +
                  `-- INICIA SCRIPT SQL --\n` +
                  `CREATE POLICY "Public full access" ON visits\n` +
                  `FOR ALL\n` +
                  `USING (true)\n` +
                  `WITH CHECK (true);\n` +
                  `-- FIN SCRIPT SQL --`;
    } else {
        message = `Ocurrió un error inesperado en la operación de ${context} con Supabase.\n\n` +
                  `Asegúrate de que tus credenciales en el archivo .env.local son correctas y de que has reiniciado el servidor de desarrollo después de cualquier cambio.\n\n` +
                  `**Detalles Técnicos:**\n` +
                  `Código: ${error.code || 'N/A'}\n` +
                  `Mensaje: ${error.message || 'No hay un mensaje de error específico del servidor.'}`;
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
        .gte('date', threeMonthsAgo.toISOString())
        .order('date', { ascending: false });

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
