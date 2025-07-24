
import { getSupabase } from '@/lib/supabase';
import type { Executive } from '@/types';

const buildSupabaseError = (error: any, context: string): Error => {
    const message = `Ocurrió un error en la operación de ${context} con Supabase. ` +
                  `Detalles: ${error?.message || JSON.stringify(error)}`;
    return new Error(message);
};

export const getExecutives = async (): Promise<Executive[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('executives')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        throw buildSupabaseError(error, 'lectura de ejecutivas');
    }
    return data || [];
};

export const addExecutive = async (executive: Omit<Executive, 'id'>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('executives').insert(executive);
    if (error) {
        throw buildSupabaseError(error, 'creación de ejecutiva');
    }
};

export const updateExecutive = async (id: number, executive: Partial<Omit<Executive, 'id'>>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('executives').update(executive).eq('id', id);
    if (error) {
        throw buildSupabaseError(error, 'actualización de ejecutiva');
    }
};

export const deleteExecutive = async (id: number): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('executives').delete().eq('id', id);
    if (error) {
        throw buildSupabaseError(error, 'eliminación de ejecutiva');
    }
};
