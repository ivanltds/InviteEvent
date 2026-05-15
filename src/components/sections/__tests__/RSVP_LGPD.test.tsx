import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';

jest.mock('@/lib/services/rsvpService');
jest.mock('@/lib/utils/confetti', () => ({
  triggerCelebration: jest.fn(),
  triggerSideCannons: jest.fn()
}));
jest.mock('@/lib/services/telemetryService', () => ({
  Telemetry: {
    track: jest.fn()
  }
}));

const mockInvite = {
  id: 'invite-123',
  evento_id: 'event-abc',
  nome_principal: 'Joaquim',
  limite_pessoas: 2,
  tipo: 'individual',
  slug: 'joaquim-test',
  created_at: new Date().toISOString()
};

const mockConfig = {
  id: 1,
  evento_id: 'event-abc',
  noiva_nome: 'Noiva',
  noivo_nome: 'Noivo',
  data_casamento: '2026-06-13',
  prazo_rsvp: '2026-05-13',
  accent_color: '#D4AF37'
};

describe('RSVP - Consentimento LGPD (TDD PRD-013)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rsvpService.getRSVPConfig as jest.Mock).mockResolvedValue(mockConfig);
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(mockInvite);
    (rsvpService.getInviteMembers as jest.Mock).mockResolvedValue([]);
    (rsvpService.getExistingRSVP as jest.Mock).mockResolvedValue(null);
  });

  test('não deve mostrar checkbox LGPD quando não há restrições alimentares', async () => {
    render(<RSVP inviteSlug="joaquim-test" config={mockConfig} />);

    // Aguarda renderização do convite
    await waitFor(() => {
      expect(screen.getByText(/Preparamos um lugar com muito carinho/i)).toBeInTheDocument();
    });

    // Por padrão o checkbox de LGPD não deve estar visível/no DOM
    expect(screen.queryByText(/Autorizo o tratamento destas informações de saúde/i)).not.toBeInTheDocument();
  });

  test('deve exibir checkbox de LGPD e bloquear o envio se houver texto em restrições alimentares', async () => {
    // Setup mocks: Se for individual, RSVP.tsx renderiza um membro virtual com campo de restrição
    render(<RSVP inviteSlug="joaquim-test" config={mockConfig} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Restrição alimentar/i)).toBeInTheDocument();
    });

    const restrictionInput = screen.getByPlaceholderText(/Restrição alimentar/i);
    
    // 1. Escreve algo nas restrições alimentares
    fireEvent.change(restrictionInput, { target: { value: 'Intolerante a Lactose' } });

    // 2. O checkbox LGPD DEVE aparecer no DOM agora
    expect(screen.getByText(/Autorizo o tratamento destas informações de saúde/i)).toBeInTheDocument();

    // 3. Tenta enviar sem marcar o checkbox
    const submitBtn = screen.getByRole('button', { name: /Confirmar Presença/i });
    fireEvent.click(submitBtn);

    // 4. Deve exibir erro de validação e NÃO disparar o serviço de submit
    await waitFor(() => {
      expect(screen.getByText(/É necessário autorizar o tratamento de seus dados de saúde/i)).toBeInTheDocument();
    });

    expect(rsvpService.submitFullRSVP).not.toHaveBeenCalled();
  });

  test('deve permitir envio bem-sucedido incluindo lgpd_consent no payload se o checkbox estiver marcado', async () => {
    (rsvpService.submitFullRSVP as jest.Mock).mockResolvedValue({ success: true });

    render(<RSVP inviteSlug="joaquim-test" config={mockConfig} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Restrição alimentar/i)).toBeInTheDocument();
    });

    const restrictionInput = screen.getByPlaceholderText(/Restrição alimentar/i);
    fireEvent.change(restrictionInput, { target: { value: 'Celiaco' } });

    // Encontra o checkbox pelo label
    const consentCheckbox = screen.getByLabelText(/Autorizo o tratamento destas informações de saúde/i);
    fireEvent.click(consentCheckbox); // Marca o consentimento

    const submitBtn = screen.getByRole('button', { name: /Confirmar Presença/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(rsvpService.submitFullRSVP).toHaveBeenCalledWith(
        expect.objectContaining({
          lgpd_consent: true
        }),
        expect.any(Array)
      );
    });
  });
});
