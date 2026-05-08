import { supabase } from '@/lib/supabase';

export interface MuralMensagem {
  id: string;
  evento_id: string;
  nome_convidado: string;
  mensagem: string;
  status: 'pendente' | 'aprovado' | 'oculto';
  created_at: string;
}

export interface MuralPhoto {
  id: string;
  evento_id: string;
  url_foto: string;
  legenda?: string;
  guest_name?: string;
  is_approved: boolean;
  created_at: string;
}

export const muralService = {
  // --- MENSAGENS ---
  async getMessages(eventoId: string): Promise<MuralMensagem[]> {
    const { data, error } = await supabase
      .from('mural_mensagens')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved messages:', error);
      return [];
    }
    return data || [];
  },

  async submitMessage(eventoId: string, nome: string, mensagem: string): Promise<boolean> {
    const { error } = await supabase
      .from('mural_mensagens')
      .insert([{
        evento_id: eventoId,
        nome_convidado: nome,
        mensagem: mensagem,
        status: 'pendente'
      }]);
    
    return !error;
  },

  async getMessagesForModeration(eventoId: string): Promise<MuralMensagem[]> {
    const { data, error } = await supabase
      .from('mural_mensagens')
      .select('*')
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages for moderation:', error);
      return [];
    }
    return data || [];
  },

  async updateMessageStatus(id: string, status: 'aprovado' | 'oculto' | 'pendente'): Promise<boolean> {
    const { error } = await supabase
      .from('mural_mensagens')
      .update({ status })
      .eq('id', id);
    return !error;
  },

  async deleteMessage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('mural_mensagens')
      .delete()
      .eq('id', id);
    return !error;
  },

  // --- FOTOS ---
  async uploadPhoto(photo: Partial<MuralPhoto>): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from('mural_fotos')
      .insert([photo]);

    return { success: !error, error };
  },

  async getApprovedPhotos(eventId: string): Promise<MuralPhoto[]> {
    const { data, error } = await supabase
      .from('mural_fotos')
      .select('*')
      .eq('evento_id', eventId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mural photos:', error);
      return [];
    }
    return data || [];
  },

  async getPhotosForModeration(eventId: string): Promise<MuralPhoto[]> {
    const { data, error } = await supabase
      .from('mural_fotos')
      .select('*')
      .eq('evento_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos for moderation:', error);
      return [];
    }
    return data || [];
  },

  async updatePhotoStatus(photoId: string, isApproved: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('mural_fotos')
      .update({ is_approved: isApproved })
      .eq('id', photoId);

    return !error;
  },

  async deletePhoto(photoId: string): Promise<boolean> {
    const { error } = await supabase
      .from('mural_fotos')
      .delete()
      .eq('id', photoId);

    return !error;
  }
};
