import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MasterSupportPanel from '../app/(admin)/admin/suporte/page';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'master-user-id' } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [
          { id: 'user-1', email: 'cliente1@gmail.com', nome: 'Cliente 1' },
        ],
        error: null,
      }),
    })),
  },
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('SupportDashboard - TDD Fase GREEN 🟢', () => {
  const mockTickets = [
    {
      id: 'ticket-1',
      usuario_id: 'user-1',
      status: 'aguardando_atendimento',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/support/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, tickets: mockTickets }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, messages: [] }),
      });
    }) as any;
  });

  it('Deve renderizar a seção de Métricas de Atendimento do Suporte', async () => {
    render(<MasterSupportPanel />);

    // Deve conter títulos ou indicadores de métricas analíticas
    await waitFor(() => {
      expect(screen.getByText('Métricas de Desempenho')).toBeInTheDocument();
      expect(screen.getByText('Total de Chamados')).toBeInTheDocument();
      expect(screen.getByText('Aguardando')).toBeInTheDocument();
      expect(screen.getByText('Tempo Médio de Resposta')).toBeInTheDocument();
    });
  });
});
