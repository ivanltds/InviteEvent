import { GET } from '../route';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    search: {
      expression: jest.fn().mockReturnThis(),
      sort_by: jest.fn().mockReturnThis(),
      max_results: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    },
    api: {
      resources: jest.fn(),
    },
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ 
      data, 
      status: init?.status || 200,
      json: async () => data 
    })),
  },
}));

describe('API Hero Images', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar lista de imagens embaralhada em caso de sucesso (Search API)', async () => {
    const mockResources = [
      { secure_url: 'url1' },
      { secure_url: 'url2' },
    ];
    
    (cloudinary.search.execute as jest.Mock).mockResolvedValue({ resources: mockResources });

    const response: any = await GET();

    expect(cloudinary.config).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.data).toContain('url1');
    expect(response.data).toContain('url2');
  });

  test('deve usar fallback se Search API retornar vazio', async () => {
    (cloudinary.search.execute as jest.Mock).mockResolvedValue({ resources: [] });
    (cloudinary.api.resources as jest.Mock).mockResolvedValue({ resources: [{ secure_url: 'fallback_url' }] });

    const response: any = await GET();

    expect(cloudinary.api.resources).toHaveBeenCalled();
    expect(response.data).toEqual(['fallback_url']);
  });

  test('deve retornar array vazio se nenhuma imagem for encontrada', async () => {
    (cloudinary.search.execute as jest.Mock).mockResolvedValue({ resources: [] });
    (cloudinary.api.resources as jest.Mock).mockResolvedValue({ resources: [] });

    const response: any = await GET();

    expect(response.data).toEqual([]);
  });

  test('deve retornar 500 em caso de erro', async () => {
    (cloudinary.search.execute as jest.Mock).mockRejectedValue(new Error('Cloudinary Error'));

    const response: any = await GET();

    expect(response.status).toBe(500);
    expect(response.data.error).toBe('Erro na busca');
  });
});
