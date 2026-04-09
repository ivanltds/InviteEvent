import { supabase } from '@/lib/supabase';
import { Evento, EventoOrganizador, Perfil } from '@/lib/types/database';

export const eventService = {
  async getMyEvents(): Promise<Evento[]> {
    const { data: profile } = await supabase.from('perfis').select('is_master').single();
    
    if (profile?.is_master) {
      const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
      return data || [];
    }

    const { data } = await supabase
      .from('eventos')
      .select('*, evento_organizadores!inner(*)')
      .eq('evento_organizadores.user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });
    
    return data || [];
  },

  async createEvent(nome: string): Promise<{ data: Evento | null; error: Error | null }> {
    const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, '-');
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    // 1. Criar o evento
    const { data: event, error: eventError } = await supabase
      .from('eventos')
      .insert([{ nome, slug }])
      .select()
      .single();

    if (eventError) return { data: null, error: new Error(eventError.message) };

    // 2. Adicionar como owner
    const { error: roleError } = await supabase
      .from('evento_organizadores')
      .insert([{ evento_id: event.id, user_id: user.id, role: 'owner' }]);

    if (roleError) return { data: event, error: new Error('Evento criado, mas erro ao atribuir permissão') };

    // 3. Criar configuração padrão (Opcional - pode falhar se RLS não estiver pronto, o ConfigPage resolve depois)
    try {
      await supabase.from('configuracoes').insert([{ 
        evento_id: event.id,
        noiva_nome: 'Noiva',
        noivo_nome: 'Noivo',
        data_casamento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +6 meses
      }]);
    } catch (e) {
      console.warn('Aviso: Falha ao criar configuração inicial automática. O sistema tentará novamente ao abrir a página de configurações.', e);
    }

    return { data: event, error: null };
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
    // Buscar o ID do usuário pelo email no perfil
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
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    // 1. Mudar o novo para owner
    const { error: err1 } = await supabase
      .from('evento_organizadores')
      .update({ role: 'owner' })
      .eq('evento_id', eventId)
      .eq('user_id', newOwnerId);

    if (err1) return false;

    // 2. Mudar o antigo para organizador
    const { error: err2 } = await supabase
      .from('evento_organizadores')
      .update({ role: 'organizador' })
      .eq('evento_id', eventId)
      .eq('user_id', user.id);
    
    return !err2;
  }
};
