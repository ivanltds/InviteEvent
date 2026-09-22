import { supabase } from '@/lib/supabase';
import { Evento, EventoOrganizador, EventoConviteEquipe, Perfil } from '@/lib/types/database';

export const eventService = {
  /** Leitura pública por slug do evento — usada pela "portaria" do Link Único (/inv/evento/[eventoSlug]). */
  async getEventoBySlug(slug: string): Promise<Evento | null> {
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    return data;
  },

  async getMyEvents(): Promise<Evento[]> {
    const { data: userResponse } = await supabase.auth.getUser();
    const user = userResponse.user;
    if (!user) return [];

    // 1. Verificar se é master
    const { data: profile } = await supabase.from('perfis').select('is_master').eq('id', user.id).maybeSingle();
    
    if (profile?.is_master) {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      return data || [];
    }

    // 2. Buscar eventos onde o usuário é organizador ou owner
    // Fazemos uma busca na tabela de ligação e depois pegamos os eventos
    const { data: userEvents } = await supabase
      .from('evento_organizadores')
      .select('evento_id')
      .eq('user_id', user.id);

    if (!userEvents || userEvents.length === 0) return [];

    const eventIds = userEvents.map((ue: any) => ue.evento_id);

    const { data: events } = await supabase
      .from('eventos')
      .select('*')
      .in('id', eventIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    return events || [];
  },

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('eventos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) return false;
    return !data;
  },

  async createEvent(nome: string): Promise<{ data: Evento | null; error: Error | null }> {
    const slug = nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;

    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    // 1. Validar e Resolver Slug (Diferenciação automática para nomes iguais)
    let finalSlug = slug;
    let isAvailable = await this.checkSlugAvailability(finalSlug);
    let attempts = 0;
    
    while (!isAvailable && attempts < 5) {
      const suffix = Math.random().toString(36).substring(2, 6);
      finalSlug = `${slug}-${suffix}`;
      isAvailable = await this.checkSlugAvailability(finalSlug);
      attempts++;
    }

    // Fallback absoluto: timestamp se tudo mais falhar
    if (!isAvailable) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    // 2. Criar o evento
    const { data: event, error: eventError } = await supabase
      .from('eventos')
      .insert([{ nome, slug: finalSlug }])
      .select()
      .single();

    if (eventError) return { data: null, error: new Error(eventError.message) };

    // Garantir que o perfil existe em perfis para evitar violação de FK devido a delays no trigger
    await supabase.from('perfis').upsert({ id: user.id, email: user.email });

    // 3. Adicionar como owner (Atômico manual)
    const { error: roleError } = await supabase
      .from('evento_organizadores')
      .insert([{ evento_id: event.id, user_id: user.id, role: 'owner' }]);

    if (roleError) {
      // Idealmente aqui faríamos um rollback se fosse uma transação DB pura, 
      // mas como o Supabase/PostgREST não expõe BEGIN/COMMIT via JS facilmente sem RPC, 
      // tratamos o erro.
      return { data: event, error: new Error('Evento criado, mas erro ao atribuir permissão de dono.') };
    }

    // 4. Criar configuração padrão
    const { error: configError } = await supabase
      .from('configuracoes')
      .insert([{ 
        evento_id: event.id,
        noiva_nome: 'Noiva',
        noivo_nome: 'Noivo',
        data_casamento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }]);

    if (configError) {
      console.warn('Falha ao criar config inicial:', configError);
    }

    return { data: event, error: null };
  },

  async getEventStats(eventId: string): Promise<{ totalConvites: number; totalConfirmados: number; totalPessoasPossiveis: number; valorPresentes: number }> {
    const { data: invites, error } = await supabase
      .from('convites')
      .select('limite_pessoas, rsvp:rsvp(confirmados, status)')
      .eq('evento_id', eventId);

    if (error) throw error;

    const giftsRes = await supabase.from('comprovantes').select('presentes!inner(preco)').eq('presentes.evento_id', eventId);

    let totalPessoasPossiveis = 0;
    let totalConfirmados = 0;

    (invites as any[])?.forEach((invite: any) => {
      totalPessoasPossiveis += (invite.limite_pessoas || 0);
      const rsvpArray = (invite as any).rsvp;
      const rsvp = Array.isArray(rsvpArray) ? rsvpArray[0] : rsvpArray;
      
      if (rsvp && rsvp.status !== 'recusado') {
        totalConfirmados += (Number(rsvp.confirmados) || 0);
      }
    });

    const valorPresentes = (giftsRes.data as any[])?.reduce((acc, curr) => {
      return acc + (Number(curr.presentes?.preco) || 0);
    }, 0) || 0;

    return {
      totalConvites: invites?.length || 0,
      totalConfirmados,
      totalPessoasPossiveis,
      valorPresentes
    };
  },

  async getOrganizers(eventId: string): Promise<(EventoOrganizador & { email: string })[]> {
    const { data, error } = await supabase
      .from('evento_organizadores')
      .select('*, user:perfis(email)')
      .eq('evento_id', eventId);
    
    if (error) return [];
    return (data as any[]).map((item: any) => ({
      ...item,
      email: item.user?.email || 'N/A'
    }));
  },

  async addOrganizer(eventId: string, email: string, role: 'owner' | 'organizador' = 'owner'): Promise<boolean> {
    const { data: profile } = await supabase.from('perfis').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (!profile) throw new Error('Usuário não encontrado com este e-mail.');

    const { error } = await supabase
      .from('evento_organizadores')
      .insert([{ evento_id: eventId, user_id: profile.id, role }]);
    
    if (error) {
      // Se já existir, tentar atualizar o papel
      const { error: updateErr } = await supabase
        .from('evento_organizadores')
        .update({ role })
        .eq('evento_id', eventId)
        .eq('user_id', profile.id);
      if (updateErr) throw new Error(error.message || 'Erro ao adicionar membro à equipe.');
    }
    return true;
  },

  async updateOrganizerRole(eventId: string, userId: string, role: 'owner' | 'organizador'): Promise<boolean> {
    // Se estiver rebaixando para organizador, verificar se ainda restará ao menos um owner
    if (role === 'organizador') {
      const { data: owners } = await supabase
        .from('evento_organizadores')
        .select('user_id')
        .eq('evento_id', eventId)
        .eq('role', 'owner');
      
      const otherOwners = owners?.filter((o: any) => o.user_id !== userId) || [];
      if (otherOwners.length === 0) {
        throw new Error('O evento precisa ter pelo menos um Proprietário.');
      }
    }

    const { error } = await supabase
      .from('evento_organizadores')
      .update({ role })
      .eq('evento_id', eventId)
      .eq('user_id', userId);
    
    return !error;
  },

  async removeOrganizer(eventId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('evento_organizadores')
      .delete()
      .eq('evento_id', eventId)
      .eq('user_id', userId);
    
    return !error;
  },

  async transferOwnership(eventId: string, newOwnerId: string): Promise<boolean> {
    // Agora promove a owner sem rebaixar o usuário atual (suporte a múltiplos proprietários)
    const { error } = await supabase
      .from('evento_organizadores')
      .update({ role: 'owner' })
      .eq('evento_id', eventId)
      .eq('user_id', newOwnerId);

    return !error;
  },

  /** Cria convite mágico compartilhável (WhatsApp/Link) para a equipe */
  async createTeamInvite(eventId: string, role: 'owner' | 'organizador' = 'owner', email?: string): Promise<EventoConviteEquipe> {
    const { data: userResponse } = await supabase.auth.getUser();
    const userId = userResponse?.user?.id;

    // Gera token aleatório de 32 chars
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const payload: any = {
      evento_id: eventId,
      token,
      role,
      criado_por: userId || null,
      email: email ? email.trim().toLowerCase() : null
    };

    const { data, error } = await supabase
      .from('evento_convites_equipe')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao gerar link de convite.');
    }

    return data as EventoConviteEquipe;
  },

  /** Lista convites pendentes e não expirados do evento */
  async getTeamInvites(eventId: string): Promise<EventoConviteEquipe[]> {
    const { data, error } = await supabase
      .from('evento_convites_equipe')
      .select('*')
      .eq('evento_id', eventId)
      .is('usado_em', null)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as EventoConviteEquipe[]) || [];
  },

  /** Revoga um convite pendente */
  async revokeTeamInvite(inviteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('evento_convites_equipe')
      .delete()
      .eq('id', inviteId);

    return !error;
  },

  /** Obtém informações básicas de um convite para exibir antes de aceitar */
  async getInviteInfo(token: string): Promise<{
    valid: boolean;
    error?: string;
    evento_id?: string;
    evento_nome?: string;
    role?: 'owner' | 'organizador';
    email_destinatario?: string;
    criado_por_email?: string;
    expira_em?: string;
  }> {
    // 1. Tentar via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('obter_info_convite_equipe', { p_token: token });
    if (!rpcError && rpcData) {
      return rpcData as any;
    }

    // 2. Fallback direto da tabela caso a RPC ainda não esteja instalada
    const { data, error } = await supabase
      .from('evento_convites_equipe')
      .select('*, evento:eventos(nome)')
      .eq('token', token)
      .is('usado_em', null)
      .gt('expira_em', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: 'Convite não encontrado, já utilizado ou expirado.' };
    }

    return {
      valid: true,
      evento_id: data.evento_id,
      evento_nome: (data.evento as any)?.nome || 'Casamento',
      role: data.role,
      email_destinatario: data.email,
      expira_em: data.expira_em
    };
  },

  /** Aceita o convite mágico e vincula o usuário autenticado à equipe */
  async acceptTeamInvite(token: string): Promise<{
    success: boolean;
    evento_id: string;
    evento_nome: string;
    role: string;
  }> {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      throw new Error('Você precisa estar logado para aceitar este convite.');
    }

    // 1. Tentar via RPC segura
    const { data: rpcData, error: rpcError } = await supabase.rpc('aceitar_convite_equipe', { p_token: token });
    if (!rpcError && rpcData && rpcData.success) {
      return rpcData;
    }

    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('not found')) {
      throw new Error(rpcError.message);
    }

    // 2. Fallback direto
    const { data: invite, error: fetchErr } = await supabase
      .from('evento_convites_equipe')
      .select('*, evento:eventos(nome)')
      .eq('token', token)
      .is('usado_em', null)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (fetchErr || !invite) {
      throw new Error('Convite inválido, já utilizado ou expirado.');
    }

    if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      throw new Error(`Este convite foi gerado para o e-mail ${invite.email}. Seu e-mail atual é ${user.email}.`);
    }

    // Inserir ou atualizar na equipe
    const { error: insertErr } = await supabase
      .from('evento_organizadores')
      .upsert([{ evento_id: invite.evento_id, user_id: user.id, role: invite.role }], { onConflict: 'evento_id,user_id' });

    if (insertErr) {
      throw new Error(insertErr.message || 'Erro ao vincular ao evento.');
    }

    // Marcar como usado
    await supabase
      .from('evento_convites_equipe')
      .update({ usado_em: new Date().toISOString(), usado_por: user.id })
      .eq('id', invite.id);

    return {
      success: true,
      evento_id: invite.evento_id,
      evento_nome: (invite.evento as any)?.nome || 'Casamento',
      role: invite.role
    };
  },

  async activateEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('eventos')
      .update({ is_active: true, payment_status: 'paid' })
      .eq('id', eventId);
    
    return !error;
  },

  async updateEvent(eventId: string, updates: { nome?: string, slug?: string }): Promise<boolean> {
    const { error } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', eventId);
    return !error;
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    // Soft delete: define deleted_at em vez de excluir permanentemente
    const { error } = await supabase
      .from('eventos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', eventId);
    return !error;
  },

  async getDeletedEvents(): Promise<Evento[]> {
    const { data: userResponse } = await supabase.auth.getUser();
    const user = userResponse.user;
    if (!user) return [];

    const { data: profile } = await supabase.from('perfis').select('is_master').eq('id', user.id).maybeSingle();
    
    if (profile?.is_master) {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      return data || [];
    }

    // Retorna vazio se não for master conforme nova regra de visibilidade restrita
    return [];
  },

  async restoreEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('eventos')
      .update({ deleted_at: null })
      .eq('id', eventId);
    return !error;
  }
};
