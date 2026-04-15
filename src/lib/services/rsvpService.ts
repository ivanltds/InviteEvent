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
      .from('convite_membros')
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
      .from('convite_membros')
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

  async submitFullRSVP(
    rsvpData: Partial<RSVP>, 
    members: Partial<ConviteMembro>[]
  ): Promise<{ success: boolean; error?: Error | null }> {
    try {
      console.log('Submitting Full RSVP:', { rsvpData, membersCount: members.length });

      const { error: rsvpError } = await supabase
        .from('rsvp')
        .upsert([{
          ...rsvpData,
          updated_at: new Date().toISOString()
        }], { onConflict: 'convite_id' });

      if (rsvpError) {
        console.error('RSVP Upsert Error Details:', JSON.stringify(rsvpError, null, 2));
        throw rsvpError;
      }

      if (members.length > 0) {
        const membersToUpdate = members.map(m => ({
          ...m,
          convite_id: rsvpData.convite_id,
          evento_id: rsvpData.evento_id,
          updated_at: new Date().toISOString()
        })).filter(m => m.id !== undefined && m.id !== 'virtual');

        if (membersToUpdate.length > 0) {
          const { error: membersError } = await supabase
            .from('convite_membros')
            .upsert(membersToUpdate);

          if (membersError) {
            console.error('Members Upsert Error Details:', JSON.stringify(membersError, null, 2));
            throw membersError;
          }
        }
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Full RSVP Final Catch:', err);
      return { success: false, error: err };
    }
  },

  async getRSVPConfig(inviteId?: string): Promise<Configuracao | null> {
    let query = supabase.from('configuracoes').select('*');
    
    if (inviteId) {
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
