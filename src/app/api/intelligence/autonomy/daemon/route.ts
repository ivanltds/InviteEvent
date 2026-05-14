import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Usamos o cliente Supabase padrão
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Dispara a RPC segura que processa a auto-cura atômica
    const { data, error } = await supabase.rpc('executar_daemon_auto_cura');

    if (error) {
      console.error('Daemon Stored Function Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Daemon Route API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
