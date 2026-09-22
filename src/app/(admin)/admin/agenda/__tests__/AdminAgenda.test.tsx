import { render, screen, waitFor } from '@testing-library/react';
import AdminAgenda from '../page';
import { useEvent } from '@/lib/contexts/EventContext';
import { configService } from '@/lib/services/configService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn() },
}));

describe('AdminAgenda — painel de resumo (Configurações)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({ currentEvent: { id: 'evento-1' } });
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }));
  });

  it('mostra o resumo de cerimônia e recepção já definidos em Configurações', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      horario_cerimonia: '15:00:00',
      horario_recepcao: '20:00:00',
      local_cerimonia: 'Sítio Catarina',
    });

    render(<AdminAgenda />);

    await waitFor(() => expect(screen.getByText(/Já definido em Configurações/i)).toBeInTheDocument());
    expect(screen.getByText('Cerimônia', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/15:00 · Sítio Catarina/i)).toBeInTheDocument();
    expect(screen.getByText(/20:00/i)).toBeInTheDocument();
    expect(screen.getByText('Editar')).toHaveAttribute('href', '/admin/configuracoes#agenda');
  });

  it('não quebra quando ainda não há config carregada', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(null);

    render(<AdminAgenda />);

    await waitFor(() => expect(screen.getByText(/Programação do Evento/i)).toBeInTheDocument());
    expect(screen.queryByText(/Já definido em Configurações/i)).not.toBeInTheDocument();
  });

  it('continua mostrando "nenhum marco" quando a agenda detalhada está vazia, mesmo com o resumo preenchido', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      horario_cerimonia: '15:00:00',
      horario_recepcao: '20:00:00',
      local_cerimonia: 'Sítio Catarina',
    });

    render(<AdminAgenda />);

    await waitFor(() => expect(screen.getByText(/Nenhum marco cadastrado na agenda ainda/i)).toBeInTheDocument());
  });
});
