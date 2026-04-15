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
    // Usando explicitamente convite_membros que é o novo nome da tabela (renomeada de convidados_membros)
    let query = supabase
      .from('convites')
      .select(`
        *,
        rsvp:rsvp (*),
        membros:convite_membros (*)
      `)
      .order('created_at', { foreignTable: 'rsvp', ascending: false });
    
    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      // Se der erro de relacionamento PGRST200, logar detalhes para debug
      if ((error as any).code === 'PGRST200') {
        console.error('Relacionamento convite_membros não encontrado no schema cache. Detalhes:', JSON.stringify(error, null, 2));
      }
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
      .from('convite_membros')
      .select('*')
      .eq('convite_id', inviteId)
      .order('nome', { ascending: true });

    return error ? [] : (data as ConviteMembro[]);
  },

  async saveMembers(inviteId: string, members: Partial<ConviteMembro>[]): Promise<{ success: boolean; error?: Error | null }> {
    try {
      // 0. Buscar o evento_id do convite para garantir consistência
      const { data: invite } = await supabase.from('convites').select('evento_id').eq('id', inviteId).single();
      const eventoId = invite?.evento_id;

      // 1. Identificar IDs que devem ser mantidos
      const idsToKeep = members.filter(m => m.id).map(m => m.id);
      
      // 2. Deletar membros que foram removidos na UI
      if (idsToKeep.length > 0) {
        const { error: delError } = await supabase
          .from('convite_membros')
          .delete()
          .eq('convite_id', inviteId)
          .not('id', 'in', `(${idsToKeep.join(',')})`);
        
        if (delError) {
          console.error('Delete Members Error:', JSON.stringify(delError, null, 2));
          throw delError;
        }
      } else {
        // Se a lista enviada não tem IDs (ex: todos são novos), deletamos todos os antigos desse convite
        const { error: delAllError } = await supabase
          .from('convite_membros')
          .delete()
          .eq('convite_id', inviteId);
        
        if (delAllError) throw delAllError;
      }

      // 3. Separar membros para Insert e Upsert
      const toUpsert = members.filter(m => m.id && m.id !== 'virtual').map(m => ({
        id: m.id,
        nome: m.nome?.trim(),
        convite_id: inviteId,
        evento_id: eventoId,
        confirmado: m.confirmado ?? null,
        restricoes: m.restricoes || ''
      })).filter(m => m.nome);

      const toInsert = members.filter(m => !m.id || m.id === 'virtual').map(m => ({
        nome: m.nome?.trim(),
        convite_id: inviteId,
        evento_id: eventoId,
        confirmado: m.confirmado ?? null,
        restricoes: m.restricoes || ''
      })).filter(m => m.nome);

      console.log('Syncing Members:', { toUpsert: toUpsert.length, toInsert: toInsert.length });

      // 4. Executar as operações
      if (toUpsert.length > 0) {
        const { error: err } = await supabase.from('convite_membros').upsert(toUpsert);
        if (err) throw err;
      }

      if (toInsert.length > 0) {
        const { error: err } = await supabase.from('convite_membros').insert(toInsert);
        if (err) throw err;
      }

      return { success: true };
    } catch (err: any) {
      console.error('Full SaveMembers Error Catch:', JSON.stringify(err, null, 2));
      return { success: false, error: err };
    }
  },

  async deleteInvite(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('convites')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async updateRSVPManually(inviteId: string, confirmados: number, status: 'confirmado' | 'recusado'): Promise<{ success: boolean; error?: Error | null }> {
    const payload = {
      convite_id: inviteId,
      confirmados,
      status,
      mensagem: 'Adicionado Manualmente pelo Admin'
    };
    
    const { error } = await supabase
      .from('rsvp')
      .upsert(payload, { onConflict: 'convite_id' });

    if (error) return { success: false, error: new Error(error.message) };
    
    // Replica o batch update para os membros nominais
    await supabase
      .from('convite_membros')
      .update({ confirmado: status === 'confirmado' })
      .eq('convite_id', inviteId);

    return { success: true };
  },

  calculateDashboardStats(invites: InviteWithRSVP[]) {
    let totalConvites = invites.length;
    let convitesRespondidos = 0;
    let pessoasConfirmadas = 0;
    let pessoasRecusadas = 0;
    let pessoasPendentes = 0;
    let excedentes = 0;
    let totalPessoasPossiveis = 0;

    invites.forEach(invite => {
      const rsvpArray = (invite as any).rsvp;
      const rsvp = Array.isArray(rsvpArray) ? rsvpArray[0] : rsvpArray;
      const hasRSVP = !!rsvp;
      const limite = invite.limite_pessoas || 0;
      totalPessoasPossiveis += limite;

      if (hasRSVP) convitesRespondidos++;

      if (rsvp) {
        if (rsvp.status === 'recusado') {
          pessoasRecusadas += limite;
        } else {
          const totalConfirmadosNesseConvite = Number(rsvp.confirmados) || 0;
          pessoasConfirmadas += totalConfirmadosNesseConvite;
          
          if (totalConfirmadosNesseConvite > limite) {
            excedentes += (totalConfirmadosNesseConvite - limite);
          }
        }
      } else {
        pessoasPendentes += limite;
      }
    });

    return {
      totalConvites,
      convitesRespondidos,
      pessoasConfirmadas,
      pessoasRecusadas,
      pessoasPendentes,
      totalPessoasPossiveis,
      excedentes
    };
  }
};
