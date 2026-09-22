import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingChatWidget from '../LandingChatWidget';

function mockFetchSequence(...responses: Array<{ success: boolean; [key: string]: unknown }>) {
  const impl = jest.fn();
  responses.forEach(r => {
    impl.mockImplementationOnce(() => Promise.resolve({ json: async () => r }));
  });
  global.fetch = impl as unknown as typeof fetch;
  return impl;
}

describe('LandingChatWidget', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: jest.fn().mockReturnValue('session-abc') },
      configurable: true,
    });
  });

  it('começa fechado, mostrando só o botão flutuante', () => {
    render(<LandingChatWidget />);
    expect(screen.queryByText(/Fale com a gente/i)).not.toBeInTheDocument();
  });

  it('abre a janela e mostra o estado vazio quando não há histórico', async () => {
    mockFetchSequence({ success: true, messages: [] });

    render(<LandingChatWidget />);
    fireEvent.click(screen.getByLabelText(/Tirar dúvidas sobre o InviteEvent/i));

    expect(await screen.findByText(/Fale com a gente/i)).toBeInTheDocument();
    expect(await screen.findByText(/Quer saber como funciona/i)).toBeInTheDocument();
  });

  it('restaura o histórico salvo da sessão ao abrir', async () => {
    mockFetchSequence({
      success: true,
      messages: [
        { role: 'user', conteudo: 'Quanto custa?' },
        { role: 'assistant', conteudo: 'A ativação é feita direto no painel.' },
      ],
    });

    render(<LandingChatWidget />);
    fireEvent.click(screen.getByLabelText(/Tirar dúvidas sobre o InviteEvent/i));

    expect(await screen.findByText('Quanto custa?')).toBeInTheDocument();
    expect(await screen.findByText(/A ativação é feita direto no painel/i)).toBeInTheDocument();
  });

  it('gera e persiste um session_id no localStorage', async () => {
    mockFetchSequence({ success: true, messages: [] });
    render(<LandingChatWidget />);
    fireEvent.click(screen.getByLabelText(/Tirar dúvidas sobre o InviteEvent/i));

    await waitFor(() => expect(window.localStorage.getItem('landing_chat_session_id')).toBe('session-abc'));
  });

  it('envia a mensagem do usuário e mostra a resposta do assistente', async () => {
    mockFetchSequence(
      { success: true, messages: [] }, // GET histórico ao abrir
      { success: true, response: 'O InviteEvent cuida do RSVP pra você.' } // POST da mensagem
    );

    render(<LandingChatWidget />);
    fireEvent.click(screen.getByLabelText(/Tirar dúvidas sobre o InviteEvent/i));
    await screen.findByText(/Fale com a gente/i);

    fireEvent.change(screen.getByPlaceholderText(/Digite sua pergunta/i), { target: { value: 'Como funciona o RSVP?' } });
    fireEvent.click(screen.getByText('Enviar'));

    expect(await screen.findByText('Como funciona o RSVP?')).toBeInTheDocument();
    expect(await screen.findByText(/O InviteEvent cuida do RSVP/i)).toBeInTheDocument();
  });

  it('mostra uma mensagem amigável se o envio falhar', async () => {
    mockFetchSequence({ success: true, messages: [] });
    const failingFetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({ json: async () => ({ success: true, messages: [] }) }))
      .mockImplementationOnce(() => Promise.reject(new Error('network down')));
    global.fetch = failingFetch as unknown as typeof fetch;

    render(<LandingChatWidget />);
    fireEvent.click(screen.getByLabelText(/Tirar dúvidas sobre o InviteEvent/i));
    await screen.findByText(/Fale com a gente/i);

    fireEvent.change(screen.getByPlaceholderText(/Digite sua pergunta/i), { target: { value: 'oi' } });
    fireEvent.click(screen.getByText('Enviar'));

    expect(await screen.findByText(/não consegui responder agora/i)).toBeInTheDocument();
  });
});
