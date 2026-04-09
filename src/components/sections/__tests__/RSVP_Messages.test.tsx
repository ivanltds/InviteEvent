import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';

// Mock do serviço
jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: {
    getRSVPConfig: jest.fn().mockResolvedValue({ prazo_rsvp: '2026-06-13' }),
    getInviteBySlug: jest.fn(),
    getInviteMembers: jest.fn().mockResolvedValue([]),
    getExistingRSVP: jest.fn().mockResolvedValue(null),
    submitRSVP: jest.fn().mockResolvedValue({ success: true }),
    updateMemberStatus: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Custom Messages by Type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMock = (tipo: string) => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue({ 
      id: 'c1', 
      nome_principal: 'Teste', 
      limite_pessoas: 2, 
      slug: 'teste',
      tipo: tipo
    });
  };

  const confirmRSVP = async () => {
    await waitFor(() => screen.getByText(/Olá,/));
    const submitBtn = screen.getByText('Confirmar Presença');
    fireEvent.click(submitBtn);
  };

  test('deve mostrar mensagem para INDIVIDUAL', async () => {
    setupMock('individual');
    render(<RSVP inviteSlug="teste" />);
    await confirmRSVP();
    
    await waitFor(() => {
      expect(screen.getByText('Sua presença está confirmada!')).toBeInTheDocument();
      expect(screen.getByText(/Ter você por perto tornará nosso dia ainda mais especial!/i)).toBeInTheDocument();
    });
  });

  test('deve mostrar mensagem para CASAL', async () => {
    setupMock('casal');
    render(<RSVP inviteSlug="teste" />);
    await confirmRSVP();
    
    await waitFor(() => {
      expect(screen.getByText('Presença confirmada!')).toBeInTheDocument();
      expect(screen.getByText(/Ter um casal tão querido ao nosso lado torna tudo mais mágico!/i)).toBeInTheDocument();
    });
  });

  test('deve mostrar mensagem para FAMILIA', async () => {
    setupMock('familia');
    render(<RSVP inviteSlug="teste" />);
    await confirmRSVP();
    
    await waitFor(() => {
      expect(screen.getByText('Família confirmada!')).toBeInTheDocument();
      expect(screen.getByText(/A presença da família é o que dá vida à nossa festa./i)).toBeInTheDocument();
    });
  });
});
