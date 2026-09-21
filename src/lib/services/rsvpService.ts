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
        const enriched = members.map(m => ({
          ...m,
          convite_id: rsvpData.convite_id,
          evento_id: rsvpData.evento_id,
          updated_at: new Date().toISOString()
        }));

        // Membros com id real: upsert (atualiza os já existentes).
        const membersToUpdate = enriched.filter(m => m.id !== undefined && m.id !== 'virtual');

        if (membersToUpdate.length > 0) {
          const { error: membersError } = await supabase
            .from('convite_membros')
            .upsert(membersToUpdate);

          if (membersError) {
            console.error('Members Upsert Error Details:', JSON.stringify(membersError, null, 2));
            throw membersError;
          }
        }

        // Membros novos (sem id, ex.: acompanhantes nomeados adicionados
        // depois do auto-cadastro no modo Link Único — pedido do usuário
        // em 21/09/2026): insert em vez de upsert, sem passar `id`
        // nenhum pro Postgres gerar. 'virtual' continua sendo ignorado
        // (é só um placeholder de UI pro convite individual sem membro
        // real cadastrado — nunca deve virar uma linha no banco).
        const membersToInsert = enriched
          .filter(m => m.id === undefined)
          .map(({ id: _id, ...rest }) => rest)
          .filter(m => m.nome && m.nome.trim());

        if (membersToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('convite_membros')
            .insert(membersToInsert);

          if (insertError) {
            console.error('Members Insert Error Details:', JSON.stringify(insertError, null, 2));
            throw insertError;
          }
        }
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Full RSVP Final Catch:', err);
      return { success: false, error: err };
    }
  },

  async confirmRSVP(
    inviteId: string,
    members: Array<{ id: string; confirmado: boolean; restricoes?: string }>,
    rsvpData: { confirmados?: number; mensagem?: string; telefone?: string; evento_id?: string }
  ): Promise<{ success: boolean; data?: any; error?: Error | null }> {
    const { data, error } = await supabase.rpc('confirm_rsvp_v1', {
      p_convite_id: inviteId,
      p_membros: members,
      p_rsvp_data: rsvpData
    });

    if (error) {
      console.error('Error calling confirm_rsvp_v1:', error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, data };
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
