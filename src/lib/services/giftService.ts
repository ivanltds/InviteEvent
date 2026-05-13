import { supabase } from '@/lib/supabase';
import { Presente } from '@/lib/types/database';

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
  }
};

