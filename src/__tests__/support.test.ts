import { supabase } from '../lib/supabase';

// Mock Supabase to simulate RED phase of TDD before database provision is applied
jest.mock('../lib/supabase', () => {
  const actualSupabase = jest.requireActual('../lib/supabase').supabase;
  return {
    supabase: {
      ...actualSupabase,
      from: jest.fn((table: string) => {
        if (table === 'suporte_tickets' || table === 'suporte_mensagens') {
          // In the RED phase, these tables do not exist in the database or will fail
          return {
            select: jest.fn().mockRejectedValue(new Error(`Relation "${table}" does not exist`)),
            insert: jest.fn().mockRejectedValue(new Error(`Relation "${table}" does not exist`)),
            update: jest.fn().mockRejectedValue(new Error(`Relation "${table}" does not exist`)),
          };
        }
        return actualSupabase.from(table);
      }),
    },
  };
});

describe('Suporte por Chat & Tickets (SLA 2h) - TDD Fase RED 🔴', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Deve falhar ao tentar criar um ticket se a tabela não estiver provisionada (RED)', async () => {
    const mockTicketData = {
      usuario_id: 'user-uuid-123',
      evento_id: 'event-uuid-456',
      status: 'aguardando_atendimento',
    };

    await expect(supabase.from('suporte_tickets').insert(mockTicketData)).rejects.toThrow(
      'Relation "suporte_tickets" does not exist'
    );
  });

  test('Deve falhar ao tentar buscar mensagens se a tabela não estiver provisionada (RED)', async () => {
    await expect(supabase.from('suporte_mensagens').select('*')).rejects.toThrow(
      'Relation "suporte_mensagens" does not exist'
    );
  });
});
