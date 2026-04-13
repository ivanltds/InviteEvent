import { supabase } from '@/lib/supabase';
import { Evento, EventoOrganizador, Perfil } from '@/lib/types/database';

export const eventService = {
  async getMyEvents(): Promise<Evento[]> {
    const { data: userResponse } = await supabase.auth.getUser();
    const user = userResponse.user;
    if (!user) return [];

    // 1. Verificar se é master
    const { data: profile } = await supabase.from('perfis').select('is_master').eq('id', user.id).maybeSingle();
    
    if (profile?.is_master) {
      const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
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
    
    // Se o slug já existe (ex: 'thiago-e-andreia'), tentamos gerar um variante única
    if (!isAvailable) {
      const suffix = Math.random().toString(36).substring(2, 6);
      finalSlug = `${slug}-${suffix}`;
      isAvailable = await this.checkSlugAvailability(finalSlug);
      
      // Fallback extremo se o randômico também colidir (improvável)
      if (!isAvailable) {
        finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    // 2. Criar o evento
    const { data: event, error: eventError } = await supabase
      .from('eventos')
      .insert([{ nome, slug: finalSlug }])
      .select()
      .single();

    if (eventError) return { data: null, error: new Error(eventError.message) };

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

  async getEventStats(eventId: string): Promise<{ totalConvites: number; totalConfirmados: number }> {
    const [convitesRes, rsvpRes] = await Promise.all([
      supabase.from('convites').select('id', { count: 'exact' }).eq('evento_id', eventId),
      supabase.from('rsvp').select('id', { count: 'exact' }).eq('evento_id', eventId)
    ]);

    return {
      totalConvites: convitesRes.count || 0,
      totalConfirmados: rsvpRes.count || 0
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

  async addOrganizer(eventId: string, email: string, role: 'owner' | 'organizador' = 'organizador'): Promise<boolean> {
    const { data: profile } = await supabase.from('perfis').select('id').eq('email', email).maybeSingle();
    if (!profile) throw new Error('Usuário não encontrado com este e-mail.');

    const { error } = await supabase
      .from('evento_organizadores')
      .insert([{ evento_id: eventId, user_id: profile.id, role }]);
    
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
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (!user) return false;

    const { error: err1 } = await supabase
      .from('evento_organizadores')
      .update({ role: 'owner' })
      .eq('evento_id', eventId)
      .eq('user_id', newOwnerId);

    if (err1) return false;

    const { error: err2 } = await supabase
      .from('evento_organizadores')
      .update({ role: 'organizador' })
      .eq('evento_id', eventId)
      .eq('user_id', user.id);
    
    return !err2;
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
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventId);
    return !error;
  }
};
