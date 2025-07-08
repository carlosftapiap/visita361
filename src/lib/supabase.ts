import { createClient, SupabaseClient } from '@supabase/supabase-js';

// NOTE: The user will need to add these to a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabase) {
        return supabase;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'La configuración de Supabase está incompleta. ' +
          'Asegúrate de que tu archivo .env.local existe y contiene las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
          'Después de crearlo o modificarlo, REINICIA el servidor de desarrollo.'
        );
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
};
