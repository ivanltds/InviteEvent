import { supabase } from '@/lib/supabase';
import { RSVP, Convite, Configuracao } from '@/lib/types/database';

export const rsvpService = {
  async getInviteBySlug(slug: string): Promise<Convite | null> {
    const { data, error } = await supabase
      .from('convites')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching invite:', error);
      return null;
    }
    return data as Convite;
  },

  async searchInvite(query: string): Promise<Convite | null> {
    const { data, error } = await supabase
      .from('convites')
      .select('*')
      .or(`slug.eq.${query},nome_principal.ilike.%${query}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error searching invite:', error);
      return null;
    }
    return data as Convite;
  },

  async submitRSVP(data: Partial<RSVP>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('rsvp')
      .insert([data]);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async getRSVPConfig(): Promise<Configuracao | null> {
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
  }
};
