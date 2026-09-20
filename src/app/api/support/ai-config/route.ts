import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireMaster } from '@/lib/auth/requireMaster';

/**
 * Manages the system neural core prompt for AI master control.
 */
export async function GET() {
  try {
    const guard = await requireMaster();
    if (!guard.authorized) return guard.response;

    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .eq('key', 'master_prompt')
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore not found
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireMaster();
    if (!guard.authorized) return guard.response;

    const { system_prompt } = await request.json();
    if (!system_prompt) {
      return NextResponse.json({ success: false, error: 'Prompt vazio' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_config')
      .upsert({ key: 'master_prompt', system_prompt, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
