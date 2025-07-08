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
    let message = `Error en la operación de ${context} con Supabase.`;

    if (error.code === '42501') { // permission denied
        message += `\n\nError de permisos. Esto suele ocurrir porque la política de seguridad RLS (Row Level Security) de la tabla 'visits' no permite esta operación. Asegúrate de que has creado una política para SELECT, INSERT, UPDATE, y DELETE.`;
    } else if (error.code === '42P01') { // undefined table
        message += `\n\nLa tabla 'visits' no se encontró. Asegúrate de que la tabla ha sido creada correctamente en tu base de datos.`;
    } else {
        message += `\n\nDetalles: ${error.message || 'No hay un mensaje de error específico del servidor.'}`;
    }

    message += `\n\nRevisa la consola del navegador y la de desarrollo para más detalles técnicos.`;
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
