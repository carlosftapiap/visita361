
import { getSupabase } from '@/lib/supabase';
import type { RoiCampaign } from '@/types';

// Helper to re-use the error building logic from visitService
const buildSupabaseError = (error: any, context: string): Error => {
    const message = `Ocurrió un error en la operación de ${context} con Supabase. ` +
                  `Detalles: ${error?.message || JSON.stringify(error)}`;
    return new Error(message);
};

export const getRoiCampaigns = async (): Promise<RoiCampaign[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('roi_campaigns')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) {
        throw buildSupabaseError(error, 'lectura de campañas ROI');
    }
    return data || [];
};

type NewCampaignData = Omit<RoiCampaign, 'id' | 'roi'>;

export const addRoiCampaign = async (campaign: NewCampaignData): Promise<void> => {
    const supabase = getSupabase();
    // The 'roi' field is auto-calculated by the database, so we don't send it.
    const { error } = await supabase.from('roi_campaigns').insert(campaign);
    if (error) {
        throw buildSupabaseError(error, 'creación de campaña ROI');
    }
};

export const deleteRoiCampaign = async (id: number): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('roi_campaigns').delete().eq('id', id);
    if (error) {
        throw buildSupabaseError(error, 'eliminación de campaña ROI');
    }
};

    
