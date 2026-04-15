import { supabase } from '@/lib/supabase';

export interface MuralMensagem {
  id: string;
  evento_id: string;
  nome_convidado: string;
  mensagem: string;
  status: 'pendente' | 'aprovado' | 'oculto';
  created_at: string;
}

export const muralService = {
  async getMessages(eventoId: string): Promise<MuralMensagem[]> {
    const { data, error } = await supabase
      .from('mural_mensagens')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async submitMessage(eventoId: string, nome: string, mensagem: string): Promise<boolean> {
    const { error } = await supabase
      .from('mural_mensagens')
      .insert([{
        evento_id: eventoId,
        nome_convidado: nome,
        mensagem: mensagem,
        status: 'pendente' // Por padrão cai na moderação
      }]);

    return !error;
  }
};
