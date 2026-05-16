import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventoId = searchParams.get('eventoId');

  if (!eventoId) {
    return NextResponse.json({ success: false, error: 'Missing eventoId' }, { status: 400 });
  }

  try {
    // 1. Buscar presentes que são destaques manuais
    const { data: manualHighlights, error: manualError } = await supabase
      .from('presentes')
      .select('id')
      .eq('evento_id', eventoId)
      .eq('is_sonho_casal', true);

    if (manualError) throw manualError;

    // 2. Buscar eventos de analíticos das últimas 48h para este evento
    // Consideramos cliques e visualizações de detalhes como "interesse"
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('target_id, session_id')
      .eq('evento_id', eventoId)
      .eq('categoria', 'gift')
      .in('evento_tipo', ['click', 'section_view', 'gift_item_view', 'add_to_cart', 'external_link_click', 'checkout_init'])
      .gt('created_at', fortyEightHoursAgo);

    if (analyticsError) throw analyticsError;

    // 3. Processar afinidade por presente (Interest Score)
    // Usamos session_id para evitar inflação por um único usuário
    const interestMap: Record<string, Set<string>> = {};
    analytics?.forEach((event: any) => {
      if (event.target_id) {
        if (!interestMap[event.target_id]) {
          interestMap[event.target_id] = new Set();
        }
        interestMap[event.target_id].add(event.session_id);
      }
    });

    // 4. Consolidar dados de afinidade
    const affinityData: Record<string, any> = {};
    
    // Marcar destaques manuais
    manualHighlights?.forEach((h: any) => {
      affinityData[h.id] = {
        badge: 'dream',
        score: 1000 // Score arbitrário alto para garantir ordenação no topo
      };
    });

    // Processar pontuação baseada em telemetria real
    Object.entries(interestMap).forEach(([giftId, sessions]) => {
      const uniqueViewers = sessions.size;
      
      // Se não for destaque manual, calculamos o score real
      if (!affinityData[giftId]) {
        // Regras de Badge Inteligente:
        // - Se mais de 3 convidados distintos viram -> 'classic' (Muito cogitado)
        // - Se mais de 8 convidados distintos viram -> 'hot' (O mais amado) - Nova categoria
        
        let badge: string | null = null;
        if (uniqueViewers >= 8) badge = 'hot';
        else if (uniqueViewers >= 3) badge = 'classic';

        affinityData[giftId] = {
          badge,
          score: uniqueViewers,
          viewers: uniqueViewers
        };
      } else {
        // Se já for destaque manual, apenas adicionamos a contagem para estatística
        affinityData[giftId].viewers = uniqueViewers;
      }
    });

    return NextResponse.json({ success: true, data: affinityData });
  } catch (error: any) {
    console.error('Error fetching FOMO data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
