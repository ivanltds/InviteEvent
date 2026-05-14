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
  async lockGift(presenteId: string, sessionId: string, conviteId?: string) {
    const { data, error } = await supabase.rpc('adquirir_lock_presente_v1', {
      p_presente_id: presenteId,
      p_session_id: sessionId,
      p_convite_id: conviteId || null,
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
  },

  /**
   * Reporta um link quebrado para a fila de auto-cura (PRD-12C)
   */
  async reportBrokenLink(presenteId: string, baseId: string | null, linkQuebrado: string, motivo: string) {
    // 🛡️ DEDUPLICAÇÃO: Evitar inserir duplicado na fila se já houver um item PENDENTE para esse presente
    let checkQuery = supabase
      .from('fila_ajuste_links')
      .select('id')
      .eq('status', 'PENDENTE');

    if (presenteId) {
      checkQuery = checkQuery.eq('presente_id', presenteId);
    } else if (baseId) {
      checkQuery = checkQuery.eq('presente_base_id', baseId);
    }

    const { data: existing } = await checkQuery;
    
    if (existing && existing.length > 0) {
      console.log(`[Deduplication] Item ${presenteId || baseId} já se encontra na fila como PENDENTE. Ignorando inserção duplicada.`);
      return existing; // Retorna silenciosamente sem inserir de novo
    }

    const { data, error } = await supabase
      .from('fila_ajuste_links')
      .insert({
        presente_id: presenteId,
        presente_base_id: baseId,
        link_quebrado: linkQuebrado,
        motivo_quebra: motivo,
        status: 'PENDENTE'
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  /**
   * Retorna todos os itens pendentes na fila de ajuste de links (Acesso Master)
   */
  async getFilaAjusteLinks() {
    const { data, error } = await supabase
      .from('fila_ajuste_links')
      .select(`
        *,
        presentes_base (nome)
      `)
      .order('criado_em', { ascending: false });
      
    if (error) throw error;
    return data;
  }
};
