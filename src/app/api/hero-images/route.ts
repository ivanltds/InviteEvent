import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

const isCloudinaryConfigured = () => {
  return !!(
    (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME) &&
    (process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY) &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
};

export async function GET() {
  try {
    if (!isCloudinaryConfigured()) {
      console.warn('⚠️ Cloudinary não configurado. Retornando lista de imagens vazia.');
      return NextResponse.json([]);
    }

    configureCloudinary();

    // O Search API é a forma mais robusta de buscar por pastas (Asset Folders)
    const result = await cloudinary.search
      .expression('folder:invite/hero')
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    let finalResources = result.resources || [];

    if (finalResources.length === 0) {
      console.log('Search retornou vazio, tentando busca por prefixo...');
      const fallback = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'invite/hero',
        max_results: 50,
      });
      finalResources = fallback.resources || [];
    }

    if (finalResources.length === 0) {
      console.warn('Nenhuma imagem encontrada em invite/hero por nenhum método.');
      return NextResponse.json([]);
    }

    const images = finalResources.map((resource: any) => resource.secure_url);
    const shuffled = images.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
  } catch (error: any) {
    console.error('Erro na API Hero-Images (fallback ativado):', error.message);
    return NextResponse.json([], { status: 200 }); // Retorna lista vazia em vez de erro para não travar a UI
  }
}
