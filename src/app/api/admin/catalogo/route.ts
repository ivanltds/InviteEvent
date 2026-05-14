import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper centralizado para criar um cliente administrativo robusto
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // Para fins de segurança do cockpit de prod, usamos a chave de serviço se disponível, senão anon (que roda sob as RLS criadas)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

// GET: Retorna o inventário de presentes usando a View de Métricas + Resumo KPI + Categorias para cadastros
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();

    // 1. Busca Lista Agregada do Catálogo (via view_presentes_base_metricas)
    // Ordenado pelos criados mais recentemente por padrão
    const { data: presentes, error: fetchError } = await supabase
      .from('view_presentes_base_metricas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (fetchError) throw fetchError;

    // 2. Busca Categorias Disponíveis para preencher formulários de Novo/Edição
    const { data: categorias, error: catError } = await supabase
      .from('presentes_categorias')
      .select('id, nome, slug')
      .order('ordem_padrao', { ascending: true });

    if (catError) throw catError;

    // 3. Busca Fila de Ajustes (para o KPI de Links Quebrados na fila)
    const { data: filaLinks, error: filaError } = await supabase
      .from('fila_ajuste_links')
      .select('status');

    if (filaError) throw filaError;

    // 4. Busca Candidatos ao Catálogo (presentes criados em casamentos locais que estão com base_id = null)
    const { data: candidatos, error: candError } = await supabase
      .from('presentes')
      .select(`
        id, nome, preco, preco_de, descricao, imagem_url, link_externo, created_at,
        categoria:presentes_categorias(nome),
        evento:eventos(nome)
      `)
      .is('base_id', null)
      .order('created_at', { ascending: false });

    if (candError) throw candError;

    // 5. Computação Sintética de KPIs em Tempo Real baseados no dataset
    const items = presentes || [];
    const totalItems = items.length;
    const pausados = items.filter((i: any) => i.is_paused).length;
    const totalCandidatos = candidatos?.length || 0;
    
    // Conta links quebrados ativos na fila_ajuste_links (status PENDENTE)
    const linksQuebrados = (filaLinks || []).filter((f: any) => f.status === 'PENDENTE').length;

    // Mapeia links por grandes varejistas
    const amazonCount = items.filter((i: any) => i.link_varejo_padrao?.toLowerCase().includes('amazon')).length;
    const magaluCount = items.filter((i: any) => i.link_varejo_padrao?.toLowerCase().includes('magazineluiza') || i.link_varejo_padrao?.toLowerCase().includes('magalu')).length;

    return NextResponse.json({
      success: true,
      data: {
        presentes: items,
        categorias: categorias || [],
        candidatos: candidatos || [],
        kpis: {
          totalItems,
          pausados,
          linksQuebrados,
          amazonCount,
          magaluCount,
          totalCandidatos
        }
      }
    });

  } catch (error: any) {
    console.error('[API GET Catalogo] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Criação de um novo presente base global
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = getSupabaseClient();

    // Validação mínima
    if (!body.nome || !body.preco) {
      return NextResponse.json({ success: false, error: 'Campos nome e preço são obrigatórios.' }, { status: 400 });
    }

    const insertPayload = {
      nome: body.nome,
      preco: Number(body.preco),
      preco_de: body.preco_de ? Number(body.preco_de) : null,
      descricao: body.descricao || null,
      imagem_url: body.imagem_url || null,
      categoria_id: body.categoria_id || null,
      link_varejo_padrao: body.link_varejo_padrao || null,
      parceiro_nome: body.parceiro_nome || null,
      is_paused: !!body.is_paused,
      is_archived: false
    };

    const { data, error } = await supabase
      .from('presentes_base')
      .insert([insertPayload])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.[0] });

  } catch (error: any) {
    console.error('[API POST Catalogo] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Atualização pontual de campos de um presente base (Edição ou Toggle Pausar)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const supabase = getSupabaseClient();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID do item base é obrigatório.' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (body.nome !== undefined) updatePayload.nome = body.nome;
    if (body.preco !== undefined) updatePayload.preco = Number(body.preco);
    if (body.preco_de !== undefined) updatePayload.preco_de = body.preco_de ? Number(body.preco_de) : null;
    if (body.descricao !== undefined) updatePayload.descricao = body.descricao;
    if (body.imagem_url !== undefined) updatePayload.imagem_url = body.imagem_url;
    if (body.categoria_id !== undefined) updatePayload.categoria_id = body.categoria_id;
    if (body.link_varejo_padrao !== undefined) updatePayload.link_varejo_padrao = body.link_varejo_padrao;
    if (body.parceiro_nome !== undefined) updatePayload.parceiro_nome = body.parceiro_nome;
    if (body.is_paused !== undefined) updatePayload.is_paused = !!body.is_paused;

    const { data, error } = await supabase
      .from('presentes_base')
      .update(updatePayload)
      .eq('id', body.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.[0] });

  } catch (error: any) {
    console.error('[API PATCH Catalogo] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Tratamento robusto de Safe Global Delete (Arquivamento vs Exclusão Física)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = getSupabaseClient();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do item base é obrigatório.' }, { status: 400 });
    }

    // 1. Auditoria Preventiva: Verificar se existem registros na tabela presentes associados a esse base_id
    const { data: presentesListados, error: lookupError } = await supabase
      .from('presentes')
      .select('id')
      .eq('base_id', id);

    if (lookupError) throw lookupError;

    const idsDasListas = presentesListados?.map((p: any) => p.id) || [];

    // 2. Se o item está em alguma lista, verificar se já recebeu algum COMPROVANTE financeiro
    let jaRecebeuComprovante = false;
    
    if (idsDasListas.length > 0) {
      const { count, error: countError } = await supabase
        .from('comprovantes')
        .select('*', { count: 'exact', head: true })
        .in('presente_id', idsDasListas);
        
      if (countError) throw countError;
      if (count && count > 0) {
        jaRecebeuComprovante = true;
      }
    }

    // 3. Ramificação de Fluxo baseada no histórico financeiro do item
    if (jaRecebeuComprovante) {
      // FLUXO A: SOFT ARCHIVE (Possui rastro financeiro de convidados, impossível apagar para manter histórico de recebimentos)
      const { error: archiveError } = await supabase
        .from('presentes_base')
        .update({ is_archived: true })
        .eq('id', id);

      if (archiveError) throw archiveError;

      return NextResponse.json({
        success: true,
        action: 'archived',
        message: 'O item possuía vínculos financeiros com convidados e foi arquivado com segurança (Soft-Delete) para preservar relatórios e extratos de casamentos passados.'
      });
    } else {
      // FLUXO B: HARD DELETE (Item virgem de pagamentos, limpa com segurança)
      
      // 1º. Remove instâncias associadas em filas de ajuste de links para não quebrar a constraint
      await supabase.from('fila_ajuste_links').delete().eq('presente_base_id', id);
      
      // 2º. Remove instâncias em watchlist de preços
      await supabase.from('watchlist_itens').delete().eq('presente_base_id', id);

      // 3º. Remove instâncias duplicadas no catálogo dos organizadores que ainda NÃO foram pagas
      if (idsDasListas.length > 0) {
        // Primeiro apaga locks ativos que seguram esse presente
        await supabase.from('presentes_locks').delete().in('presente_id', idsDasListas);
        // Apaga as referências físicas na tabela presentes
        await supabase.from('presentes').delete().in('id', idsDasListas);
      }

      // 4º. Remove finalmente o item do catálogo mestre
      const { error: hardDeleteError } = await supabase
        .from('presentes_base')
        .delete()
        .eq('id', id);

      if (hardDeleteError) throw hardDeleteError;

      return NextResponse.json({
        success: true,
        action: 'deleted',
        message: 'Item removido permanentemente do catálogo global e de todas as vitrines ativas com sucesso.'
      });
    }

  } catch (error: any) {
    console.error('[API DELETE Catalogo] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
