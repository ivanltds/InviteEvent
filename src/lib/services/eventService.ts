import { supabase } from '@/lib/supabase';
import { Evento, EventoOrganizador, Perfil } from '@/lib/types/database';

export const eventService = {
  async getMyEvents(): Promise<Evento[]> {
    const { data: profile } = await supabase.from('perfis').select('is_master').single();
    
    if (profile?.is_master) {
      const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
      return data || [];
    }

    const { data: userResponse } = await supabase.auth.getUser();
    const user = userResponse.user;

    if (!user) return [];

    const { data } = await supabase
      .from('eventos')
      .select('*, evento_organizadores!inner(*)')
      .eq('evento_organizadores.user_id', user.id)
      .order('created_at', { ascending: false });
    
    return data || [];
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

    // 1. Validar disponibilidade do slug
    const isAvailable = await this.checkSlugAvailability(slug);
    if (!isAvailable) {
      return { data: null, error: new Error(`O endereço 'inv/${slug}' já está sendo usado por outro casamento. Escolha um nome diferente.`) };
    }

    // 2. Criar o evento
    const { data: event, error: eventError } = await supabase
      .from('eventos')
      .insert([{ nome, slug }])
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
        user_id: user.id, // Legado compat
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
    return data.map(item => ({
      ...item,
      email: (item as any).user?.email || 'N/A'
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
  }
};
