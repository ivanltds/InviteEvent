import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { POST } from '../app/api/intelligence/autonomy/daemon/route';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

const originalEnv = process.env;
const originalFetch = global.fetch;

describe('Direct Sourcing Self-Healing Daemon API Route - Engine Amazon & Magalu', () => {
  let mockSupabaseClient: any;
  let mockOpenAIInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      AMAZON_AFFILIATE_TAG: 'ivanltds-20',
    };

    mockSupabaseClient = {
      rpc: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIInstance);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
      json: async () => ({})
    });
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('deve sair antecipadamente com 0 processados se nao existirem itens pendentes', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

    const res = await POST();
    const data = await res.json();

    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_pending_fila_links');
    expect(res.status).toBe(200);
    expect(data.data.itens_processados).toBe(0);
  });

  it('deve acionar Engine Cognitiva e produzir links diretos curados', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ 
        data: [{ id: 'item-simulacao', nome: 'Panela Simulada', preco: 100 }], 
        error: null 
      })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            alternativas: [
              {
                store_name: "Magalu",
                product_name: "Panela Inox Premium",
                estimated_price: 80.00,
                commission_percent: 10.0,
                retail_url: "https://www.magazineluiza.com.br/p/2345678/ud/pan/",
                description: "Descrição elegante.",
                suggested_image_url: "https://images.unsplash.com/photo-inox"
              }
            ]
          })
        }
      }]
    });

    // Desativamos tag Amazon para testar link direto puro Magalu (sem MAGALU_STORE_NAME no setup base)
    delete process.env.AMAZON_AFFILIATE_TAG;

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.itens_processados).toBe(1);
    
    // Verifica se chamou o rpc salvando o link direto de produto
    expect(mockSupabaseClient.rpc).toHaveBeenLastCalledWith('apply_healed_link', expect.objectContaining({
      p_id: 'item-simulacao',
      p_status: 'CURADO',
      p_new_price: 80,
      p_new_link: 'https://www.magazineluiza.com.br/p/2345678/ud/pan/',
      p_new_title: 'Panela Inox Premium'
    }));
  });

  it('deve lidar graciosamente com erro na OpenAI e registrar falha manual na fila', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ 
        data: [{ id: 'item-falha', nome: 'Produto Invalido', preco: 100 }], 
        error: null 
      })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    mockOpenAIInstance.chat.completions.create.mockRejectedValue(new Error('Falha na rede OpenAI'));

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    // Processou 0 com sucesso, marcou o item na fila como FALHA_MANUAL no rpc de fallback
    expect(data.data.itens_processados).toBe(0);

    expect(mockSupabaseClient.rpc).toHaveBeenLastCalledWith('apply_healed_link', expect.objectContaining({
      p_id: 'item-falha',
      p_status: 'FALHA_MANUAL',
      p_new_price: null
    }));
  });

  it('deve injetar tag de monetizacao direta da Amazon dinamicamente', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ 
        data: [{ id: 'item-direto', nome: 'Panela Injetada', preco: 300 }], 
        error: null 
      })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            alternativas: [
              {
                store_name: "Amazon Brasil",
                product_name: "Panela Amazon",
                estimated_price: 250.00,
                commission_percent: 9.0,
                retail_url: "https://www.amazon.com.br/dp/B0123456",
                description: "Desc.",
                suggested_image_url: "https://images.unsplash.com/photo-inox"
              }
            ]
          })
        }
      }]
    });

    // Assegura tag ativa
    process.env.AMAZON_AFFILIATE_TAG = 'ivanltds-20';

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.itens_processados).toBe(1);
    
    // Verifica se o link final salvo na base contém o parâmetro de afiliado da Amazon anexado!
    expect(mockSupabaseClient.rpc).toHaveBeenLastCalledWith('apply_healed_link', expect.objectContaining({
      p_id: 'item-direto',
      p_status: 'CURADO',
      p_new_link: 'https://www.amazon.com.br/dp/B0123456?tag=ivanltds-20'
    }));
  });

  it('deve reescrever link Magalu usando Padrao Parceiro Magalu dinamicamente', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ 
        data: [{ id: 'item-magalu', nome: 'TV Smart', preco: 2000 }], 
        error: null 
      })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            alternativas: [
              {
                store_name: "Magalu",
                product_name: "Smart TV 50",
                estimated_price: 1800.00,
                commission_percent: 4.0,
                retail_url: "https://www.magazineluiza.com.br/p/9876543/et/tves/",
                description: "Desc.",
                suggested_image_url: "https://images.unsplash.com/photo-tv"
              }
            ]
          })
        }
      }]
    });

    // Configura vitrine Magalu
    process.env.MAGALU_STORE_NAME = 'ivanltdsloja';

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.itens_processados).toBe(1);
    
    // Verifica se o link final foi reescrito para a vitrine do parceiro Magalu
    expect(mockSupabaseClient.rpc).toHaveBeenLastCalledWith('apply_healed_link', expect.objectContaining({
      p_id: 'item-magalu',
      p_status: 'CURADO',
      p_new_link: 'https://www.magazinevoce.com.br/magazineivanltdsloja/p/9876543/'
    }));

    delete process.env.MAGALU_STORE_NAME;
  });
});
