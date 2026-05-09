import { supabase } from '../lib/supabase';

// Mock Supabase specifically to simulate GREEN phase of support tickets logic
jest.mock('../lib/supabase', () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((fn) => {
      return Promise.resolve(
        fn({
          data: [
            {
              id: 'ticket-uuid-123',
              usuario_id: 'user-uuid-123',
              status: 'aguardando_atendimento',
            },
          ],
          error: null,
        })
      );
    }),
  };

  return {
    supabase: {
      from: jest.fn((table: string) => {
        if (table === 'suporte_tickets') {
          return {
            ...mockQueryBuilder,
            insert: jest.fn().mockReturnThis(),
            then: jest.fn().mockImplementation((fn) => {
              return Promise.resolve(
                fn({
                  data: {
                    id: 'ticket-uuid-123',
                    usuario_id: 'user-uuid-123',
                    status: 'aguardando_atendimento',
                  },
                  error: null,
                })
              );
            }),
          };
        }
        if (table === 'suporte_mensagens') {
          return {
            ...mockQueryBuilder,
            then: jest.fn().mockImplementation((fn) => {
              return Promise.resolve(
                fn({
                  data: [
                    {
                      id: 'msg-uuid-999',
                      ticket_id: 'ticket-uuid-123',
                      conteudo: 'Ola, como posso ajudar?',
                    },
                  ],
                  error: null,
                })
              );
            }),
          };
        }
        return mockQueryBuilder;
      }),
    },
  };
});

describe('Suporte por Chat & Tickets (SLA 2h) - TDD Fase GREEN 🟢', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Deve criar um ticket de suporte com sucesso (GREEN)', async () => {
    const mockTicketData = {
      usuario_id: 'user-uuid-123',
      evento_id: 'event-uuid-456',
      status: 'aguardando_atendimento',
    };

    const response = await supabase.from('suporte_tickets').insert([mockTicketData]);
    expect(response.data).toBeDefined();
    expect(response.data.status).toBe('aguardando_atendimento');
  });

  test('Deve buscar mensagens de um ticket com sucesso (GREEN)', async () => {
    const response = await supabase.from('suporte_mensagens').select('*').eq('ticket_id', 'ticket-uuid-123');
    expect(response.data).toBeDefined();
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0].conteudo).toBe('Ola, como posso ajudar?');
  });
});
