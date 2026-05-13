import { supabase } from '@/lib/supabase';

export interface ReserveGiftsParams {
  presentesIds: string[];
  urlComprovante: string;
  conviteId?: string;
  eventoId?: string;
  convidadoNome?: string;
  mensagem?: string;
}

export const giftService = {
  /**
   * Reserva um ou mais presentes através da RPC segura.
   */
  async reserveGifts(params: ReserveGiftsParams) {
    const { data, error } = await supabase.rpc('reservar_multiplos_presentes_v2', {
      p_presentes_ids: params.presentesIds,
      p_url_comprovante: params.urlComprovante,
      p_convite_id: params.conviteId,
      p_evento_id: params.eventoId,
      p_convidado_nome: params.convidadoNome,
      p_mensagem: params.mensagem,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Adquire um lock de 3 horas para um presente (Lomadee/Links Externos).
   */
  async lockGift(presenteId: string, sessionId: string) {
    const { data, error } = await supabase.rpc('adquirir_lock_presente_v1', {
      p_presente_id: presenteId,
      p_session_id: sessionId,
    });

    if (error) throw error;
    return data as { sucesso: boolean; mensagem: string };
  },

  /**
   * Libera voluntariamente um lock de presente retido pela sessão atual.
   */
  async unlockGift(presenteId: string, sessionId: string) {
    const { error } = await supabase.rpc('liberar_lock_presente_v1', {
      p_presente_id: presenteId,
      p_session_id: sessionId,
    });

    if (error) throw error;
  },


  /**
   * Obtém os KPIs financeiros para o dashboard admin.
   */
  async getDashboardKpis(eventoId: string) {
    const { data, error } = await supabase
      .from('comprovantes')
      .select('valor')
      .match({ evento_id: eventoId, status: 'confirmado' });

    if (error) throw error;

    const totalArrecadado = (data || []).reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

    return {
      totalArrecadado,
    };
  },

  /**
   * Confirma uma transação de presente (ação do admin).
   */
  async confirmTransaction(transactionId: string) {
    const { error } = await supabase
      .from('comprovantes')
      .update({ status: 'confirmado' })
      .eq('id', transactionId);

    if (error) throw error;
  },

  /**
   * Lista todas as transações de um evento.
   */
  async getTransactions(eventoId: string) {
    const { data, error } = await supabase
      .from('comprovantes')
      .select(`
        *,
        presentes (nome)
      `)
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
