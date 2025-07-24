
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

export const updateExecutive = async (id: number, executive: Partial<Omit<Executive, 'id' | 'name'>>): Promise<void> => {
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

export const uploadExecutivePhoto = async (file: File): Promise<string> => {
    const supabase = getSupabase();
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('executive-photos')
        .upload(filePath, file);

    if (uploadError) {
        throw buildSupabaseError(uploadError, 'carga de foto de ejecutiva');
    }

    const { data } = supabase.storage
        .from('executive-photos')
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error("No se pudo obtener la URL pública de la imagen después de subirla.");
    }
    
    return data.publicUrl;
};
