import { supabase } from '@/lib/supabase';
import { Configuracao } from '@/lib/types/database';

export const configService = {
  async getConfig(eventoId?: string): Promise<Configuracao | null> {
    let query = supabase.from('configuracoes').select('*');
    
    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    } else {
      query = query.eq('id', 1); // Fallback para compatibilidade legada
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching config:', error);
      return null;
    }
    return data as Configuracao;
  },

  async updateConfig(eventoId: string, config: Partial<Configuracao>): Promise<{ success: boolean; error?: Error | null }> {
    if (!config) {
      return { success: false, error: new Error('Missing config object to update') };
    }

    // Removemos o ID explicitamente para evitar conflito com a sequence do banco
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...dataWithoutId } = config;
    
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ ...dataWithoutId, evento_id: eventoId }, { onConflict: 'evento_id' });

    return { success: !error, error: error ? new Error(error.message) : null };
  }
};

