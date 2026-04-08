import { supabase } from '@/lib/supabase';
import { Convite, RSVP } from '@/lib/types/database';

export interface InviteWithRSVP extends Convite {
  rsvp: RSVP[];
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

  async getAllInvites(): Promise<InviteWithRSVP[]> {
    const { data, error } = await supabase
      .from('convites')
      .select(`
        *,
        rsvp (*)
      `)
      .order('created_at', { ascending: false });

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

  async deleteInvite(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('convites')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  }
};
