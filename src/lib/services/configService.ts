import { supabase } from '@/lib/supabase';
import { Configuracao } from '@/lib/types/database';

export const configService = {
  async getConfig(): Promise<Configuracao | null> {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching config:', error);
      return null;
    }
    return data as Configuracao;
  },

  async updateConfig(config: Partial<Configuracao>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('configuracoes')
      .update(config)
      .eq('id', 1);

    return { success: !error, error: error ? new Error(error.message) : null };
  }
};
