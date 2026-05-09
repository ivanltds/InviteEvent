import { supabase } from '@/lib/supabase';
import { MuralItem } from '@/lib/types/database';

export const muralService = {
  // --- MURAL ITENS UNIFICADOS ---
  async getApprovedItems(eventoId: string): Promise<MuralItem[]> {
    const { data: items, error: errorItems } = await supabase
      .from('mural_itens')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('aprovado', true);

    const { data: msgs, error: errorMsgs } = await supabase
      .from('mural_mensagens')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('status', 'aprovado');

    if (errorItems) console.error('Error fetching approved mural items:', errorItems);
    if (errorMsgs) console.error('Error fetching approved mural messages:', errorMsgs);

    const mappedMsgs: MuralItem[] = (msgs || []).map((m: any) => ({
      id: m.id,
      evento_id: m.evento_id,
      autor: m.nome_convidado,
      mensagem: m.mensagem,
      tipo: 'MENSAGEM',
      aprovado: true,
      criado_em: m.created_at,
      url_midia: undefined
    }));

    const combined = [...(items || []), ...mappedMsgs];
    // Sort by creation date descending
    return combined.sort((a, b) => {
      const dateA = new Date(a.criado_em || 0).getTime();
      const dateB = new Date(b.criado_em || 0).getTime();
      return dateB - dateA;
    });
  },

  async submitItem(item: Partial<MuralItem>): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from('mural_itens')
      .insert([{
        ...item,
        aprovado: false // Sempre pendente inicialmente
      }]);
    
    return { success: !error, error };
  },

  async getItemsForModeration(eventoId: string): Promise<MuralItem[]> {
    const { data, error } = await supabase
      .from('mural_itens')
      .select('*')
      .eq('evento_id', eventoId)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Error fetching mural items for moderation:', error);
      return [];
    }
    return data || [];
  },

  async updateItemStatus(id: string, aprovado: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('mural_itens')
      .update({ aprovado })
      .eq('id', id);
    return !error;
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('mural_itens')
      .delete()
      .eq('id', id);
    return !error;
  }
};
