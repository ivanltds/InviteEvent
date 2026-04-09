import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';

// Mock do serviço
jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: {
    getRSVPConfig: jest.fn().mockResolvedValue({ prazo_rsvp: '2026-06-13' }),
    getInviteBySlug: jest.fn().mockResolvedValue({ id: 'c1', nome_principal: 'Teste', limite_pessoas: 2, slug: 'teste' }),
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

describe('RSVP Auth Error Reproduction', () => {
  const originalURLSearchParams = global.URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('teste')
    }));
    
    // Silenciar console.error nos testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.alert = jest.fn();
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  test('deve mostrar mensagem de erro de RLS na tela quando submitRSVP falha', async () => {
    (rsvpService.submitRSVP as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: { message: 'new row violates row-level security policy' } 
    });

    render(<RSVP inviteSlug="teste" />);
    
    await waitFor(() => screen.getByText(/Olá,/));
    
    const submitBtn = screen.getByText('Confirmar Presença');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Acesso não autorizado pelo banco de dados/i)).toBeInTheDocument();
    });
  });
});
