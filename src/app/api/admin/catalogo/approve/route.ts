import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
}

// POST: Promove um presente local de um casamento específico para o catálogo SaaS Global (presentes_base)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { presenteId } = body;
    const supabase = getSupabaseClient();

    if (!presenteId) {
      return NextResponse.json({ success: false, error: 'ID do presente candidato é obrigatório.' }, { status: 400 });
    }

    // 1. Busca dados completos do presente local
    const { data: localGift, error: fetchError } = await supabase
      .from('presentes')
      .select('*')
      .eq('id', presenteId)
      .single();

    if (fetchError || !localGift) {
      return NextResponse.json({ success: false, error: 'Presente candidato não localizado no banco de dados.' }, { status: 404 });
    }

    if (localGift.base_id) {
      return NextResponse.json({ success: false, error: 'Este item já pertence ou está vinculado ao catálogo global.' }, { status: 400 });
    }

    // 2. Insere os dados convertidos na tabela presentes_base
    const insertPayload = {
      nome: localGift.nome,
      preco: Number(localGift.preco),
      preco_de: localGift.preco_de ? Number(localGift.preco_de) : null,
      descricao: localGift.descricao || null,
      imagem_url: localGift.imagem_url || null,
      categoria_id: localGift.categoria_id || null,
      link_varejo_padrao: localGift.link_externo || null,
      parceiro_nome: 'CURADORIA MANUAL',
      is_paused: false,
      is_archived: false
    };

    const { data: newBaseItem, error: insertError } = await supabase
      .from('presentes_base')
      .insert([insertPayload])
      .select()
      .single();

    if (insertError || !newBaseItem) {
      console.error('[Approve Candidate] Insertion Error:', insertError);
      throw new Error(`Erro ao registrar no catálogo global: ${insertError?.message}`);
    }

    // 3. Vincula retroativamente o presente local original ao ID criado para tirá-lo da fila de candidatos
    const { error: updateError } = await supabase
      .from('presentes')
      .update({ base_id: newBaseItem.id })
      .eq('id', presenteId);

    if (updateError) {
      console.error('[Approve Candidate] Update Link Error:', updateError);
      // Mesmo falhando o update local, o item base foi criado, mas lançamos erro de integridade para o admin
      throw new Error(`Catálogo criado (${newBaseItem.id}), mas falhou o vínculo local.`);
    }

    return NextResponse.json({
      success: true,
      message: `"${localGift.nome}" foi promovido com sucesso ao acervo SaaS global!`,
      baseItemId: newBaseItem.id
    });

  } catch (error: any) {
    console.error('[API POST ApproveCandidate] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
