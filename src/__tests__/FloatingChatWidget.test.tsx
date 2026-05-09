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
});
