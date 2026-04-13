import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { eventId, folder = 'general' } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 });
    }

    // 1. Validar Sessão
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken || '');

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Gerar Assinatura
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder: `casamentos/${eventId}/${folder}`,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: paramsToSign.folder,
    });
  } catch (error) {
    console.error('Erro ao gerar assinatura Cloudinary:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
