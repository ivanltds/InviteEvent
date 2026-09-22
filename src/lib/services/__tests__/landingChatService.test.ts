// A factory de jest.mock roda antes de qualquer `const` deste arquivo (é
// hoisted pro topo) — por isso o mock de `create` precisa nascer DENTRO da
// factory e ser exposto pelo módulo mockado, em vez de referenciar uma
// variável externa (que ainda estaria em TDZ nesse ponto).
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

import { LandingChatService } from '../landingChatService';
import { getSupabaseServerClient } from '@/lib/supabase-server';
const mockCreate = (jest.requireMock('openai') as { __mockCreate: jest.Mock }).__mockCreate;

/** Chain mínima e genérica que cobre os métodos usados pelo serviço, com um valor terminal configurável. */
interface SupabaseChainMock {
  select: jest.Mock;
  eq: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  order: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
  limit: jest.Mock;
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => unknown;
}

function createChain(resolvedValue: unknown = { data: null, error: null }): SupabaseChainMock {
  const chain = {} as SupabaseChainMock;
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(() => Promise.resolve(resolvedValue));
  chain.single = jest.fn(() => Promise.resolve(resolvedValue));
  chain.limit = jest.fn(() => Promise.resolve(resolvedValue));
  chain.then = (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject);
  return chain;
}

describe('LandingChatService', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  describe('getOrCreateLead', () => {
    it('retorna o lead existente sem criar um novo', async () => {
      const existing = { id: 'lead-1', session_id: 's1' };
      const from = jest.fn(() => createChain({ data: existing, error: null }));
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from });

      const lead = await LandingChatService.getOrCreateLead('s1');

      expect(lead).toEqual(existing);
      expect(from).toHaveBeenCalledTimes(1);
    });

    it('cria um novo lead com os utms quando a sessão ainda não existe', async () => {
      const created = { id: 'lead-2', session_id: 's2' };
      const from = jest
        .fn()
        .mockReturnValueOnce(createChain({ data: null, error: null })) // select/maybeSingle: não encontrou
        .mockReturnValueOnce(createChain({ data: created, error: null })); // insert/select/single
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from });

      const lead = await LandingChatService.getOrCreateLead('s2', { source: 'google', medium: 'cpc', campaign: 'lancamento' });

      expect(lead).toEqual(created);
      expect(from).toHaveBeenCalledTimes(2);
    });
  });

  describe('getHistory', () => {
    it('mapeia e reverte as mensagens para ordem cronológica', async () => {
      const rows = [
        { role: 'assistant', conteudo: 'resposta 2' },
        { role: 'user', conteudo: 'pergunta 1' },
      ]; // vem em ordem desc (mais novo primeiro)
      const from = jest.fn(() => createChain({ data: rows, error: null }));
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from });

      const history = await LandingChatService.getHistory('lead-1', 10);

      expect(history).toEqual([
        { role: 'user', content: 'pergunta 1' },
        { role: 'assistant', content: 'resposta 2' },
      ]);
    });
  });

  describe('captureContact', () => {
    it('não faz update se nenhum dado foi fornecido', async () => {
      const from = jest.fn();
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from });

      await LandingChatService.captureContact('s1');

      expect(from).not.toHaveBeenCalled();
    });

    it('atualiza só os campos fornecidos', async () => {
      const chain = createChain({ data: null, error: null });
      const from = jest.fn(() => chain);
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from });

      await LandingChatService.captureContact('s1', 'a@b.com');

      expect(chain.update).toHaveBeenCalledWith({ email: 'a@b.com' });
    });
  });

  describe('processMessage', () => {
    function mockLeadAndHistory(lead = { id: 'lead-1', session_id: 's1' }, history: unknown[] = []) {
      // getHistory usa .limit() como terminal; getOrCreateLead usa .maybeSingle(). O mesmo objeto responde aos dois,
      // então sobrescrevemos limit especificamente para devolver o histórico.
      const chain = createChain({ data: lead, error: null });
      chain.limit = jest.fn(() => Promise.resolve({ data: history, error: null }));
      const fromImpl = jest.fn(() => chain);
      (getSupabaseServerClient as jest.Mock).mockResolvedValue({ from: fromImpl });
      return fromImpl;
    }

    it('usa o simulador local quando OPENAI_API_KEY não está definida', async () => {
      delete process.env.OPENAI_API_KEY;
      mockLeadAndHistory();

      const result = await LandingChatService.processMessage('s1', 'Oi, quanto custa?');

      expect(result.response).toContain('[SIMULADOR]');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('retorna a resposta da IA quando não há tool call', async () => {
      mockLeadAndHistory();
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Olá! O InviteEvent ajuda a criar seu convite digital.' } }],
      });

      const result = await LandingChatService.processMessage('s1', 'Me conta mais');

      expect(result.response).toBe('Olá! O InviteEvent ajuda a criar seu convite digital.');
      expect(result.leadId).toBe('lead-1');
    });

    it('nunca envia mensagens de sistema com valores em R$ (checagem de guard-rail do prompt)', async () => {
      mockLeadAndHistory();
      mockCreate.mockResolvedValue({ choices: [{ message: { content: 'texto qualquer' } }] });

      await LandingChatService.processMessage('s1', 'quanto custa?');

      const callArgs = mockCreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content as string;
      expect(systemMessage).toMatch(/NUNCA cite valores em reais/i);
    });

    it('captura o contato quando a IA chama a tool capturar_contato', async () => {
      const fromImpl = mockLeadAndHistory();
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            tool_calls: [{
              type: 'function',
              function: { name: 'capturar_contato', arguments: JSON.stringify({ email: 'lead@x.com' }) },
            }],
          },
        }],
      });

      const result = await LandingChatService.processMessage('s1', 'meu email é lead@x.com');

      expect(result.response).toMatch(/anotei aqui/i);
      // getOrCreateLead + getHistory + saveMessage(user) + captureContact(update) + saveMessage(assistant)
      expect(fromImpl).toHaveBeenCalledWith('landing_leads');
      expect(fromImpl).toHaveBeenCalledWith('landing_chat_mensagens');
    });

    it('cai no simulador se a chamada à OpenAI falhar', async () => {
      mockLeadAndHistory();
      mockCreate.mockRejectedValue(new Error('API fora do ar'));

      const result = await LandingChatService.processMessage('s1', 'oi');

      expect(result.response).toContain('[SIMULADOR]');
    });
  });
});
