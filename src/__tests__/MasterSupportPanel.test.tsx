import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
          { id: 'user-2', email: 'cliente2@gmail.com', nome: 'Cliente 2' },
        ],
        error: null,
      }),
    })),
  },
}));

// Mock do window.HTMLElement.prototype.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('MasterSupportPanel - TDD Fase GREEN 🟢', () => {
  const mockTickets = [
    {
      id: 'ticket-1',
      usuario_id: 'user-1',
      status: 'aguardando_atendimento',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // aberto há 30m
      email_usuario: 'cliente1@gmail.com',
    },
    {
      id: 'ticket-2',
      usuario_id: 'user-2',
      status: 'em_atendimento',
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // aberto há 1h30
      email_usuario: 'cliente2@gmail.com',
    },
  ];

  const mockMessages = [
    {
      id: 'msg-1',
      ticket_id: 'ticket-1',
      remetente_id: 'user-1',
      conteudo: 'Olá, preciso de ajuda com o Pix.',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/support/tickets') && !url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, tickets: mockTickets }),
        });
      }
      if (url.includes('/api/support/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, messages: mockMessages }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }) as any;
  });

  it('Deve renderizar o cabeçalho e a lista de tickets do Master Admin', async () => {
    render(<MasterSupportPanel />);

    expect(screen.getByText('Painel de Atendimento (Master)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('cliente1@gmail.com')).toBeInTheDocument();
      expect(screen.getByText('cliente2@gmail.com')).toBeInTheDocument();
    });
  });

  it('Deve exibir o tempo de SLA regressivo formatado na lista', async () => {
    render(<MasterSupportPanel />);

    await waitFor(() => {
      expect(screen.getByText(/SLA: 01:(29|30):/)).toBeInTheDocument(); // 2h - 30m = 1h30m aproximados
    });
  });

  it('Deve permitir selecionar um ticket e exibir suas mensagens', async () => {
    render(<MasterSupportPanel />);

    await waitFor(() => {
      const ticketCard = screen.getByText('cliente1@gmail.com');
      fireEvent.click(ticketCard);
    });

    await waitFor(() => {
      expect(screen.getByText('Olá, preciso de ajuda com o Pix.')).toBeInTheDocument();
    });
  });

  it('Deve permitir enviar uma resposta e alterar o status do ticket', async () => {
    render(<MasterSupportPanel />);

    await waitFor(() => {
      const ticketCard = screen.getByText('cliente1@gmail.com');
      fireEvent.click(ticketCard);
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Digite a resposta para o cliente...');
      fireEvent.change(input, { target: { value: 'Resposta do Master Admin' } });

      const sendBtn = screen.getByText('Responder');
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/support/messages', expect.any(Object));
    });
  });

  it('Deve exibir banner de Atendimento Finalizado e interrupção de SLA no chat do painel master', async () => {
    const finalizadoTicket = {
      id: 'ticket-f',
      usuario_id: 'user-1',
      status: 'finalizado',
      created_at: new Date().toISOString(),
      email_usuario: 'cliente1@gmail.com',
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/support/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, tickets: [finalizadoTicket] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, messages: [] }) });
    });

    render(<MasterSupportPanel />);

    // Clica no ticket finalizado
    await waitFor(() => {
      const card = screen.getByText('cliente1@gmail.com');
      fireEvent.click(card);
    });

    // Deve exibir o indicador finalizado
    await waitFor(() => {
      expect(screen.getByText('O SLA foi interrompido.')).toBeInTheDocument();
    });
  });
});
