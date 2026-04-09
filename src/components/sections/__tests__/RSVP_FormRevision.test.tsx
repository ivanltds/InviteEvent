import { render, screen, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';

jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: {
    getRSVPConfig: jest.fn().mockResolvedValue({ prazo_rsvp: '2026-06-13' }),
    getInviteBySlug: jest.fn(),
    getInviteMembers: jest.fn().mockResolvedValue([]),
    getExistingRSVP: jest.fn().mockResolvedValue(null),
    submitRSVP: jest.fn(),
    updateMemberStatus: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Form Revision by Type', () => {
  const setupMock = (tipo: string, membros: any[] = []) => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue({ 
      id: 'c1', nome_principal: 'Convidado Teste', tipo: tipo, slug: 'teste' 
    });
    (rsvpService.getInviteMembers as jest.Mock).mockResolvedValue(membros);
  };

  test('deve mostrar textos singulares para convite INDIVIDUAL', async () => {
    setupMock('individual');
    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => {
      expect(screen.getByText(/com muito carinho para você/i)).toBeInTheDocument();
      expect(screen.getByText(/Você poderá celebrar conosco\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Sim, estarei lá!/i)).toBeInTheDocument();
    });
    
    // Convidado individual não deve ver lista de membros ou campo de quantidade
    expect(screen.queryByText(/Quem do seu grupo/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Quantas pessoas/i)).not.toBeInTheDocument();
  });

  test('deve mostrar textos plurais para convite CASAL', async () => {
    setupMock('casal', [{ id: 'm1', nome: 'Membro 1' }, { id: 'm2', nome: 'Membro 2' }]);
    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => {
      expect(screen.getByText(/receber vocês dois/i)).toBeInTheDocument();
      expect(screen.getByText(/Vocês poderão celebrar conosco\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmem a presença de vocês:/i)).toBeInTheDocument();
    });
  });

  test('deve mostrar textos de FAMÍLIA', async () => {
    setupMock('familia', [{ id: 'm1', nome: 'Membro 1' }]);
    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => {
      expect(screen.getByText(/especial para sua família/i)).toBeInTheDocument();
      expect(screen.getByText(/Sua família poderá celebrar conosco\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Quem da família virá celebrar conosco\?/i)).toBeInTheDocument();
    });
  });
});
