import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FloatingChatWidget from '../components/support/FloatingChatWidget';

// Mock scrollIntoView para jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock do global.fetch para simular chamadas de API do suporte
beforeEach(() => {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/support/tickets')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            tickets: [
              {
                id: 'ticket-123',
                status: 'aguardando_atendimento',
                created_at: new Date().toISOString(),
              },
            ],
          }),
      } as any);
    }
    if (url.includes('/api/support/messages')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            messages: [
              {
                id: 'msg-1',
                ticket_id: 'ticket-123',
                remetente_id: 'test-user-id',
                conteudo: 'Ola, preciso de suporte premium!',
                created_at: new Date().toISOString(),
              },
            ],
          }),
      } as any);
    }
    return Promise.resolve({
      json: () => Promise.resolve({ success: true }),
    } as any);
  }) as jest.Mock;
});

describe('FloatingChatWidget - TDD Fase GREEN 🟢', () => {
  test('Deve renderizar o botão flutuante de suporte inicialmente', () => {
    render(<FloatingChatWidget usuarioId="test-user-id" />);
    const button = screen.getByLabelText('Abrir suporte por chat');
    expect(button).toBeInTheDocument();
  });

  test('Deve abrir a gaveta de chat e exibir mensagens ao clicar no botão', async () => {
    render(<FloatingChatWidget usuarioId="test-user-id" />);
    const button = screen.getByLabelText('Abrir suporte por chat');

    await act(async () => {
      fireEvent.click(button);
    });

    const header = screen.getByText('Suporte ao Cliente');
    expect(header).toBeInTheDocument();

    const msg = await screen.findByText('Ola, preciso de suporte premium!');
    expect(msg).toBeInTheDocument();
  });

  test('NÃO deve exibir o texto SLA Restante (regra do negócio cliente)', async () => {
    render(<FloatingChatWidget usuarioId="test-user-id" />);
    const button = screen.getByLabelText('Abrir suporte por chat');

    await act(async () => {
      fireEvent.click(button);
    });

    // Aguarda renderizar
    await screen.findByText('Suporte ao Cliente');
    
    // Garante que a string de SLA não existe na UI para o cliente
    expect(screen.queryByText(/SLA/i)).not.toBeInTheDocument();
  });

  test('Deve exibir indicador de Atendimento Finalizado quando ticket estiver concluído', async () => {
    // Configura o mock para retornar um ticket finalizado
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        tickets: [{ id: 'ticket-old', status: 'finalizado', created_at: new Date().toISOString() }]
      })
    }));

    render(<FloatingChatWidget usuarioId="test-user-id" />);
    const button = screen.getByLabelText('Abrir suporte por chat');

    await act(async () => {
      fireEvent.click(button);
    });

    const statusBadge = await screen.findByText('Atendimento Finalizado');
    expect(statusBadge).toBeInTheDocument();
    expect(screen.getByText(/iniciar um novo atendimento/i)).toBeInTheDocument();
  });

  test('Deve criar um novo ticket ao enviar mensagem em um ticket finalizado', async () => {
    // Mock para carregar ticket inicial finalizado
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/support/tickets') && !url.includes('POST')) {
         return Promise.resolve({
           json: () => Promise.resolve({
             success: true,
             tickets: [{ id: 'ticket-finished', status: 'finalizado', created_at: new Date().toISOString() }]
           })
         });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, ticket: { id: 'ticket-new', status: 'aguardando_atendimento' }, message: { id: 'msg-new', conteudo: 'Nova ajuda' } })
      });
    });

    render(<FloatingChatWidget usuarioId="test-user-id" />);
    const button = screen.getByLabelText('Abrir suporte por chat');

    await act(async () => {
      fireEvent.click(button);
    });

    await screen.findByText('Atendimento Finalizado');

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByText('Enviar');

    fireEvent.change(input, { target: { value: 'Preciso de ajuda de novo!' } });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Deve chamar o POST do tickets para criar novo
    expect(global.fetch).toHaveBeenCalledWith('/api/support/tickets', expect.objectContaining({
      method: 'POST'
    }));
  });
});
