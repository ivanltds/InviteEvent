import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Issue Tracker Engine: Reads all registered tracking cards.
 */
export async function GET() {
  try {
    // Buscar issues trazendo os tickets vinculados E os dados de perfil do usuário em um único tiro!
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        suporte_tickets (
          id,
          created_at,
          usuario_id,
          perfis (
            nome,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, issues });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/**
 * Update Issue Status (Drag & Drop or explicit change)
 */
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ success: false, error: 'Faltam campos' }, { status: 400 });

    const { data, error } = await supabase
      .from('issues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // 🔥 SUPER AUTOMAÇÃO: Se corrigida, avisa TODOS os chamados relacionados!
    if (status === 'corrigida') {
      console.log('[AUTO-RESOLVE] Disparando notificações para tickets vinculados à issue:', id);
      
      // 1. Buscar todos os tickets vinculados
      const { data: tickets } = await supabase
        .from('suporte_tickets')
        .select('id')
        .eq('issue_id', id);

      if (tickets && tickets.length > 0) {
        // 2. Preparar mensagens automáticas
        const messagesToInsert = tickets.map(tk => ({
          ticket_id: tk.id,
          remetente_id: '00000000-0000-0000-0000-000000000000',
          conteudo: `✅ **BOAS NOTÍCIAS!** 🛠️\n\nNossa equipe técnica acaba de disponibilizar uma nova versão do sistema que **corrige o problema** relatado por você neste atendimento!\n\nPor favor, recarregue a página e verifique se voltou ao normal. Ficou tudo certo?`
        }));

        // 3. Salvar todas de uma vez
        await supabase.from('suporte_mensagens').insert(messagesToInsert);
        console.log(`[AUTO-RESOLVE] Notificações enviadas para ${tickets.length} tickets!`);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
