import { supabase } from '@/lib/supabase';
import { Presente } from '@/lib/types/database';

export const giftService = {
  async getAllGifts(eventoId?: string): Promise<Presente[]> {
    let query = supabase.from('presentes').select('*');
    
    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    }

    const { data, error } = await query.order('preco', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
    return data as Presente[];
  },

  async createGift(gift: Partial<Presente>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .insert([gift]);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async updateGift(id: string, gift: Partial<Presente>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .update(gift)
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async deleteGift(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async reserveGift(presenteId: string, comprovanteUrl: string, convidadoNome: string, conviteId?: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('reservar_presente_v1', {
      p_presente_id: presenteId,
      p_url_comprovante: comprovanteUrl,
      p_convidado_nome: convidadoNome,
      p_convite_id: conviteId
    });

    if (error) {
      console.error('Error reserving gift:', error);
      return { success: false, message: 'Erro ao reservar presente.' };
    }

    return data as { success: boolean; message: string };
  }
};
