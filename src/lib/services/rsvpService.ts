import { supabase } from '@/lib/supabase';
import { RSVP, Convite, Configuracao, ConviteMembro } from '@/lib/types/database';

export const rsvpService = {
  async getInviteBySlug(slug: string): Promise<Convite | null> {
    const { data, error } = await supabase
      .from('convites')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching invite by slug:', error);
      return null;
    }
    return data as Convite;
  },

  async getInviteMembers(inviteId: string): Promise<ConviteMembro[]> {
    const { data, error } = await supabase
      .from('convidados_membros')
      .select('*')
      .eq('convite_id', inviteId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }
    return data as ConviteMembro[];
  },

  async updateMemberStatus(memberId: string, confirmado: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('convidados_membros')
      .update({ confirmado })
      .eq('id', memberId);

    return !error;
  },

  async getExistingRSVP(inviteId: string): Promise<RSVP | null> {
    const { data, error } = await supabase
      .from('rsvp')
      .select('*')
      .eq('convite_id', inviteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching existing RSVP:', error);
      return null;
    }
    return data as RSVP;
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

  async getRSVPConfig(inviteId?: string): Promise<Configuracao | null> {
    let query = supabase.from('configuracoes').select('*');
    
    if (inviteId) {
      // Buscar o evento_id do convite primeiro
      const { data: invite } = await supabase.from('convites').select('evento_id').eq('id', inviteId).single();
      if (invite?.evento_id) {
        query = query.eq('evento_id', invite.evento_id);
      } else {
        query = query.eq('id', 1);
      }
    } else {
      query = query.eq('id', 1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching config:', error);
      return null;
    }
    return data as Configuracao;
  }
};
