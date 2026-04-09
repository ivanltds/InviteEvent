import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';

jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: {
    getRSVPConfig: jest.fn().mockResolvedValue({ prazo_rsvp: '2026-06-13' }),
    getInviteBySlug: jest.fn(),
    getInviteMembers: jest.fn().mockResolvedValue([]),
    getExistingRSVP: jest.fn(),
    submitRSVP: jest.fn(),
    updateMemberStatus: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Remember Response', () => {
  const setupMock = (tipo: string, rsvp: any = null) => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue({ 
      id: 'c1', nome_principal: 'Convidado Teste', tipo: tipo, slug: 'teste' 
    });
    (rsvpService.getExistingRSVP as jest.Mock).mockResolvedValue(rsvp);
  };

  test('deve mostrar mensagem de "já confirmado" e ocultar form se houver RSVP', async () => {
    setupMock('individual', { status: 'confirmado', confirmados: 1 });
    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => {
      expect(screen.getByText(/já está confirmada/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Você poderá celebrar conosco/i)).not.toBeInTheDocument();
    });

    // Deve mostrar o botão de mudar de ideia
    const editBtn = screen.getByText(/Mudei de ideia/i);
    fireEvent.click(editBtn);

    // Após clicar, o form deve aparecer
    expect(screen.getByLabelText(/Você poderá celebrar conosco/i)).toBeInTheDocument();
  });

  test('deve mostrar mensagem de "recusado" se o status for recusado', async () => {
    setupMock('individual', { status: 'recusado', confirmados: 0 });
    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => {
      expect(screen.getByText(/não poderá comparecer/i)).toBeInTheDocument();
    });
  });
});
