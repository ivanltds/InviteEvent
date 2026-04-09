import { supabase } from '@/lib/supabase';
import { Convite, RSVP, ConviteMembro } from '@/lib/types/database';

export interface InviteWithRSVP extends Convite {
  rsvp: RSVP[];
  membros: ConviteMembro[];
}

export const inviteService = {
  generateObfuscatedSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    // Sufixo aleatório de 4 caracteres (hexadecimal)
    const suffix = Math.random().toString(16).substring(2, 6);
    return `${base}-${suffix}`;
  },

  async getAllInvites(eventoId?: string): Promise<InviteWithRSVP[]> {
    let query = supabase
      .from('convites')
      .select(`
        *,
        rsvp (*),
        membros:convidados_membros (*)
      `);
    
    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      return [];
    }
    return data as unknown as InviteWithRSVP[];
  },

  async getInviteBySlug(slug: string): Promise<Convite | null> {
    const { data } = await supabase
      .from('convites')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    return data;
  },

  async createInvite(invite: Partial<Convite>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('convites')
      .insert([invite]);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async updateInvite(id: string, invite: Partial<Convite>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('convites')
      .update(invite)
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async getMembers(inviteId: string): Promise<ConviteMembro[]> {
    const { data, error } = await supabase
      .from('convidados_membros')
      .select('*')
      .eq('convite_id', inviteId)
      .order('nome', { ascending: true });

    return error ? [] : (data as ConviteMembro[]);
  },

  async saveMembers(inviteId: string, members: Partial<ConviteMembro>[]): Promise<{ success: boolean; error?: Error | null }> {
    // 1. Deletar membros atuais que não estão na nova lista (se tiverem ID)
    const membersToKeep = members.filter(m => m.id).map(m => m.id);
    
    if (membersToKeep.length > 0) {
      await supabase
        .from('convidados_membros')
        .delete()
        .eq('convite_id', inviteId)
        .not('id', 'in', `(${membersToKeep.join(',')})`);
    }

    // 2. Upsert (Insere novos ou atualiza existentes)
    const payload = members.map(m => ({
      ...m,
      convite_id: inviteId
    }));

    const { error } = await supabase
      .from('convidados_membros')
      .upsert(payload);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async deleteInvite(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('convites')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  calculateDashboardStats(invites: InviteWithRSVP[]) {
    let totalConvites = invites.length;
    let convitesRespondidos = 0;
    let pessoasConfirmadas = 0;
    let pessoasRecusadas = 0;
    let pessoasPendentes = 0;
    let excedentes = 0;

    invites.forEach(invite => {
      const rsvp = invite.rsvp?.[0];
      const hasRSVP = !!rsvp;
      if (hasRSVP) convitesRespondidos++;

      // Se tem membros nominais, usamos eles para precisão
      if (invite.membros && invite.membros.length > 0) {
        invite.membros.forEach(m => {
          if (m.confirmado === true) pessoasConfirmadas++;
          else if (m.confirmado === false) pessoasRecusadas++;
          else pessoasPendentes++;
        });

        // Excedente para nominal: Se confirmados (rsvp) > total de membros cadastrados
        if (rsvp && rsvp.status === 'excedente_solicitado') {
          const confirmadosRsvp = rsvp.confirmados || 0;
          const totalMembrosCadastrados = invite.membros.length;
          // O excedente é apenas o que ultrapassa a lista nominal cadastrada
          const extra = Math.max(0, confirmadosRsvp - totalMembrosCadastrados);
          excedentes += extra;
        }
      } else {
        // Se não tem membros (convite antigo ou individual simples)
        if (rsvp) {
          if (rsvp.status === 'recusado') {
            pessoasRecusadas += invite.limite_pessoas;
          } else {
            pessoasConfirmadas += rsvp.confirmados;
            // Se confirmou menos que o limite, o resto é pendente/não vai
            const pendentes = Math.max(0, invite.limite_pessoas - rsvp.confirmados);
            pessoasPendentes += pendentes;

            if (rsvp.status === 'excedente_solicitado') {
              excedentes += Math.max(0, rsvp.confirmados - invite.limite_pessoas);
            }
          }
        } else {
          // Sem RSVP ainda
          pessoasPendentes += invite.limite_pessoas;
        }
      }
    });

    return {
      totalConvites,
      convitesRespondidos,
      pessoasConfirmadas,
      pessoasRecusadas,
      pessoasPendentes,
      excedentes
    };
  }
};
