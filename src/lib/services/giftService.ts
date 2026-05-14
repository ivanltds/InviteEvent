import { supabase } from '@/lib/supabase';
import { Presente } from '@/lib/types/database';

export interface ReserveGiftsParams {
  presentesIds: string[];
  urlComprovante: string;
  conviteId?: string;
  eventoId?: string;
  convidadoNome?: string;
  mensagem?: string;
}

export const giftService = {
  async getAllGifts(eventoId?: string): Promise<Presente[]> {
    let query = supabase.from('presentes').select('*');
    
    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    }

    const { data, error } = await query.order('preco', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
    return data as Presente[];
  },

  async getPublicGifts(eventoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('presentes')
      .select('*, presentes_locks(*)')
      .eq('evento_id', eventoId)
      .neq('status', 'pausado')
      .order('preco', { ascending: true });

    if (error) {
      console.error('Error fetching public gifts:', error);
      return [];
    }
    return data;
  },

  async createGift(gift: Partial<Presente>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .insert([gift]);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async updateGift(id: string, gift: Partial<Presente>): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .update(gift)
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async deleteGift(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('presentes')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

  async reserveGift(presenteId: string, comprovanteUrl: string, convidadoNome: string, conviteId?: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('reservar_presente_v1', {
      p_presente_id: presenteId,
      p_url_comprovante: comprovanteUrl,
      p_convidado_nome: convidadoNome,
      p_convite_id: conviteId
    });

    if (error) {
      console.error('Error reserving gift:', error);
      return { success: false, message: 'Erro ao reservar presente.' };
    }

    return data as { success: boolean; message: string };
  },

  async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('presentes_categorias')
      .select('*')
      .order('ordem_padrao', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data;
  },

  async getUnifiedSuggestions(categoriaId?: string): Promise<any[]> {
    let query = supabase
      .from('view_presentes_ranking_geral')
      .select('*');

    if (categoriaId && categoriaId !== 'todos') {
      query = query.eq('categoria_id', categoriaId);
    }

    // A view já vem ordenada por popularity_score DESC, mas garantimos aqui
    const { data, error } = await query.order('popularity_score', { ascending: false });

    if (error) {
      console.error('Error fetching unified suggestions:', error);
      return [];
    }
    return data;
  },

  async importGiftFromUnified(originId: string, type: 'base' | 'custom', eventoId: string): Promise<{ success: boolean; gift?: any; error?: Error | null }> {
    try {
      let sourceGift: any = null;
      
      if (type === 'base') {
        // 1. Buscar no catálogo master global SaaS
        const { data: baseGift, error: fetchError } = await supabase
          .from('presentes_base')
          .select('*')
          .eq('id', originId)
          .single();

        if (fetchError || !baseGift) {
          throw new Error(fetchError?.message || 'Item base não encontrado.');
        }
        
        sourceGift = {
          nome: baseGift.nome,
          preco: baseGift.preco,
          descricao: baseGift.descricao,
          imagem_url: baseGift.imagem_url,
          categoria_id: baseGift.categoria_id,
          base_id: baseGift.id,
          link_externo: baseGift.link_varejo_padrao
        };
      } else {
        // 2. Buscar presente customizado vindo de outro casamento cadastrado por um par
        const { data: customGift, error: fetchError } = await supabase
          .from('presentes')
          .select('*')
          .eq('id', originId)
          .single();

        if (fetchError || !customGift) {
          throw new Error(fetchError?.message || 'Presente customizado de origem não encontrado.');
        }

        sourceGift = {
          nome: customGift.nome,
          preco: customGift.preco,
          descricao: customGift.descricao,
          imagem_url: customGift.imagem_url,
          categoria_id: customGift.categoria_id,
          base_id: null, // Itens manuais clonados continuam com base_id nulo
          link_externo: customGift.link_externo
        };
      }

      // 3. Inserir clone na tabela do evento de destino
      const { data: inserted, error: insertError } = await supabase
        .from('presentes')
        .insert([{
          evento_id: eventoId,
          nome: sourceGift.nome,
          preco: sourceGift.preco,
          descricao: sourceGift.descricao,
          imagem_url: sourceGift.imagem_url,
          categoria_id: sourceGift.categoria_id,
          base_id: sourceGift.base_id,
          link_externo: sourceGift.link_externo,
          status: 'disponivel',
          quantidade_total: 1,
          quantidade_reservada: 0
        }])
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      return { success: true, gift: inserted, error: null };
    } catch (err: any) {
      console.error('Error importing unified gift:', err);
      return { success: false, error: err };
    }
  },

  async getRankedCategories(eventoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('view_presentes_categoria_ranking')
      .select('*')
      .eq('evento_id', eventoId);

    if (error) {
      console.error('Error fetching ranked categories:', error);
      return [];
    }
    return data;
  },

  async lockGift(presenteId: string, sessionId: string, conviteId?: string) {
    const { data, error } = await supabase.rpc('adquirir_lock_presente_v1', {
      p_presente_id: presenteId,
      p_session_id: sessionId,
      p_convite_id: conviteId || null,
    });

    if (error) throw error;
    return data as { sucesso: boolean; mensagem: string };
  },

  async unlockGift(presenteId: string, sessionId: string) {
    const { error } = await supabase.rpc('liberar_lock_presente_v1', {
      p_presente_id: presenteId,
      p_session_id: sessionId,
    });

    if (error) throw error;
  },

  // --- NOVAS OPERAÇÕES DE ADMINISTRAÇÃO CONSOLIDADA ---
  async getAdminGifts(eventoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('presentes')
      .select('*, categoria:presentes_categorias(nome), presentes_locks(*, convite:convites(nome_principal))')
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin gifts:', error);
      return [];
    }
    return data;
  },

  async getAdminComprovantes(eventoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('comprovantes')
      .select('*, presente:presentes!inner(nome, preco, evento_id), convite:convites(nome_principal)')
      .eq('presente.evento_id', eventoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin comprovantes:', error);
      return [];
    }
    return data;
  },

  async createGiftWithReturn(gift: Partial<Presente>): Promise<{ success: boolean; data?: any; error?: Error | null }> {
    const { data, error } = await supabase
      .from('presentes')
      .insert([gift])
      .select('*, categoria:presentes_categorias(nome)');

    return {
      success: !error && !!data,
      data: data ? data[0] : null,
      error: error ? new Error(error.message) : null
    };
  },

  async updateGiftWithReturn(id: string, gift: Partial<Presente>): Promise<{ success: boolean; data?: any; error?: Error | null }> {
    const { data, error } = await supabase
      .from('presentes')
      .update(gift)
      .eq('id', id)
      .select('*, categoria:presentes_categorias(nome)');

    return {
      success: !error && !!data,
      data: data ? data[0] : null,
      error: error ? new Error(error.message) : null
    };
  },

  async deleteComprovante(id: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase
      .from('comprovantes')
      .delete()
      .eq('id', id);

    return { success: !error, error: error ? new Error(error.message) : null };
  },

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
      return existing; 
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

