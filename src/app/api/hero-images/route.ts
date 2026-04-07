import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

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
    configureCloudinary();

    // O Search API é a forma mais robusta de buscar por pastas (Asset Folders)
    // Ele busca especificamente por arquivos que pertencem à pasta "invite/hero"
    const result = await cloudinary.search
      .expression('folder:invite/hero')
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    console.log(`--- Busca por Pasta invite/hero ---`);
    console.log(`Encontrados no Search: ${result.resources.length} imagens`);

    // Se o Search não retornar nada (caso a conta não tenha o Search index ativo),
    // tentamos o método de recursos com prefixo novamente
    let finalResources = result.resources;

    if (finalResources.length === 0) {
      console.log('Search retornou vazio, tentando busca por prefixo...');
      const fallback = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'invite/hero',
        max_results: 50,
      });
      finalResources = fallback.resources;
    }

    if (finalResources.length === 0) {
      console.warn('Nenhuma imagem encontrada em invite/hero por nenhum método.');
      return NextResponse.json([]);
    }

    const images = finalResources.map((resource: any) => resource.secure_url);
    const shuffled = images.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
  } catch (error: any) {
    console.error('Erro na API Hero-Images:', error.message);
    return NextResponse.json({ error: 'Erro na busca', details: error.message }, { status: 500 });
  }
}
