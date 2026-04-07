import { supabase } from '@/lib/supabase';
import { Convite, RSVP } from '@/lib/types/database';

export interface InviteWithRSVP extends Convite {
  rsvp: RSVP[];
}

export const inviteService = {
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
