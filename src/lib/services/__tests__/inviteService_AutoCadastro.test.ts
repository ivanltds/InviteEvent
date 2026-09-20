import { inviteService } from '../inviteService';
import { supabase } from '@/lib/supabase';

// Mock encadeável por tabela: cada chamada a supabase.from(table) devolve um
// objeto de mocks próprio, para diferenciar o comportamento entre
// 'convites' e 'convite_membros' na mesma chamada de método.
jest.mock('@/lib/supabase', () => {
  const chains: Record<string, any> = {};

  const makeChain = () => {
    const chain: any = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((resolve) => Promise.resolve(resolve({ data: null, error: null }))),
    };
    return chain;
  };

  return {
    supabase: {
      from: jest.fn((table: string) => {
        if (!chains[table]) chains[table] = makeChain();
        return chains[table];
      }),
      __chains: chains,
    },
  };
});

describe('inviteService.criarConviteAutoCadastro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase as any).__chains.convites = undefined;
    (supabase as any).__chains.convite_membros = undefined;
  });

  it('recusa nome vazio sem chamar o banco', async () => {
    const result = await inviteService.criarConviteAutoCadastro('evt-1', '   ', []);

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/nome/i);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('cria convite tipo individual quando não há acompanhantes', async () => {
    const conviteChain = supabase.from('convites');
    (conviteChain.single as jest.Mock).mockResolvedValue({
      data: { id: 'c1', slug: 'joao-silva-a1b2' },
      error: null,
    });

    const result = await inviteService.criarConviteAutoCadastro('evt-1', 'João Silva', []);

    expect(result.success).toBe(true);
    expect(result.convite?.slug).toBe('joao-silva-a1b2');
    expect(conviteChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ evento_id: 'evt-1', nome_principal: 'João Silva', tipo: 'individual', limite_pessoas: 1 }),
    ]);
  });

  it('cria convite tipo casal com 1 acompanhante, e insere os 2 membros nomeados', async () => {
    const conviteChain = supabase.from('convites');
    (conviteChain.single as jest.Mock).mockResolvedValue({
      data: { id: 'c2', slug: 'maria-souza-c3d4' },
      error: null,
    });
    const membrosChain = supabase.from('convite_membros');
    (membrosChain.then as jest.Mock).mockImplementation((resolve: any) =>
      Promise.resolve(resolve({
        data: [
          { id: 'm1', convite_id: 'c2', nome: 'Maria Souza' },
          { id: 'm2', convite_id: 'c2', nome: 'Pedro Souza' },
        ],
        error: null,
      }))
    );

    const result = await inviteService.criarConviteAutoCadastro('evt-1', 'Maria Souza', ['Pedro Souza']);

    expect(result.success).toBe(true);
    expect(conviteChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ tipo: 'casal', limite_pessoas: 2 }),
    ]);
    expect(membrosChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ convite_id: 'c2', nome: 'Maria Souza' }),
      expect.objectContaining({ convite_id: 'c2', nome: 'Pedro Souza' }),
    ]);
    // Retorna os membros criados COM id — é o que a tela de RSVP precisa
    // pra reaproveitar submitFullRSVP sem uma segunda ida ao banco.
    expect(result.membros).toEqual([
      expect.objectContaining({ id: 'm1', nome: 'Maria Souza' }),
      expect.objectContaining({ id: 'm2', nome: 'Pedro Souza' }),
    ]);
  });

  it('cria convite tipo familia com 2+ acompanhantes e ignora nomes vazios', async () => {
    const conviteChain = supabase.from('convites');
    (conviteChain.single as jest.Mock).mockResolvedValue({
      data: { id: 'c3', slug: 'familia-lima-e5f6' },
      error: null,
    });

    const result = await inviteService.criarConviteAutoCadastro('evt-1', 'Ana Lima', ['Beto Lima', '  ', 'Cris Lima']);

    expect(result.success).toBe(true);
    expect(conviteChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ tipo: 'familia', limite_pessoas: 3 }),
    ]);
  });

  it('retorna erro quando a criação do convite falha', async () => {
    const conviteChain = supabase.from('convites');
    (conviteChain.single as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'RLS violation' },
    });

    const result = await inviteService.criarConviteAutoCadastro('evt-1', 'João Silva', []);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('RLS violation');
  });
});
