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
        console.error("Error fetching visits from Supabase:", error);
        throw new Error(`Error al obtener visitas: ${error.message}. Asegúrate de que la tabla 'visits' existe y las credenciales son correctas.`);
    }

    return data ? data.map(visitFromSupabase) : [];
};

export const addVisit = async (visit: Omit<Visit, 'id'>) => {
    const supabase = getSupabase();
    // Supabase auto-generates the ID, so we don't include it in the insert.
    const { error } = await supabase.from('visits').insert([visit]);

    if (error) {
        console.error("Error adding visit to Supabase:", error);
        throw new Error(`Error al añadir visita: ${error.message}`);
    }
};

export const updateVisit = async (id: string, visit: Partial<Omit<Visit, 'id'>>) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').update(visit).eq('id', id);

    if (error) {
        console.error("Error updating visit in Supabase:", error);
        throw new Error(`Error al actualizar visita: ${error.message}`);
    }
};

export const addBatchVisits = async (visits: Omit<Visit, 'id'>[]) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('visits').insert(visits);
    
    if (error) {
        console.error("Error batch adding visits to Supabase:", error);
        throw new Error(`Error al añadir visitas en lote: ${error.message}`);
    }
};

export const deleteAllVisits = async () => {
    const supabase = getSupabase();
    // A safe way to delete all rows. We can match any row.
    const { error } = await supabase.from('visits').delete().neq('id', '-1'); // Assuming ID is never -1
    
    if (error) {
        console.error("Error deleting all visits from Supabase:", error);
        throw new Error(`Error al eliminar todas las visitas: ${error.message}`);
    }
};
