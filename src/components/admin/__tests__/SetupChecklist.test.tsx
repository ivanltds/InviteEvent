import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetupChecklist from '../SetupChecklist';
import { configService } from '@/lib/services/configService';
import { supabase } from '@/lib/supabase';
import { DEFAULT_CONFIG } from '@/lib/constants/configDefaults';

jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn() },
}));

function mockCount(count: number) {
  return {
    eq: jest.fn().mockResolvedValue({ count, error: null }),
  };
}

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

describe('SetupChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupCounts(agenda = 0, faq = 0, presentes = 0) {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const counts: Record<string, number> = { eventos_agenda: agenda, faq, presentes };
      return { select: jest.fn().mockReturnValue(mockCount(counts[table] ?? 0)) };
    });
  }

  it('não renderiza nada enquanto carrega', async () => {
    (configService.getConfig as jest.Mock).mockReturnValue(new Promise(() => {})); // nunca resolve
    setupCounts();

    const { container } = render(<SetupChecklist eventId="evento-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando o progresso já está em 100%', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      id: 1,
      evento_id: 'evento-1',
      ...DEFAULT_CONFIG,
      noiva_nome: 'Layslla',
      noivo_nome: 'Marcus',
      created_at: '2026-01-01T00:00:00.000Z',
      data_casamento: '2027-01-01',
      local_cerimonia: 'Sítio Catarina',
      endereco_cerimonia: 'Av. Real',
      hero_images: ['foto.jpg'],
      modo_arrecadacao: 'nenhum',
    });
    setupCounts(1, 1, 0);

    const { container } = render(<SetupChecklist eventId="evento-1" />);
    await waitFor(() => expect(configService.getConfig).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o checklist com os itens pendentes e o percentual', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      id: 1,
      evento_id: 'evento-1',
      ...DEFAULT_CONFIG,
      created_at: '2026-01-01T00:00:00.000Z',
      data_casamento: '2026-06-30', // ~180 dias após created_at, ainda "auto-gerada"
    });
    setupCounts(0, 0, 0);

    render(<SetupChecklist eventId="evento-1" />);

    await waitFor(() => expect(screen.getByText(/Continue configurando/i)).toBeInTheDocument());
    expect(screen.getByText(/0 de 7 passos concluídos/i)).toBeInTheDocument();
    expect(screen.getByText(/Definir os nomes dos noivos/i)).toBeInTheDocument();
    expect(screen.getByText(/Ainda não experimentou/i)).toBeInTheDocument();
  });

  it('permite ocultar o checklist (estado local, some da tela)', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      id: 1,
      evento_id: 'evento-1',
      ...DEFAULT_CONFIG,
      created_at: '2026-01-01T00:00:00.000Z',
      data_casamento: '2026-06-30',
    });
    setupCounts(0, 0, 0);

    render(<SetupChecklist eventId="evento-1" />);
    await waitFor(() => expect(screen.getByText(/Continue configurando/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Ocultar por enquanto/i));
    expect(screen.queryByText(/Continue configurando/i)).not.toBeInTheDocument();
  });

  it('linka cada item para a âncora certa em /admin/configuracoes', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      id: 1,
      evento_id: 'evento-1',
      ...DEFAULT_CONFIG,
      created_at: '2026-01-01T00:00:00.000Z',
      data_casamento: '2026-06-30',
    });
    setupCounts(0, 0, 0);

    render(<SetupChecklist eventId="evento-1" />);
    await waitFor(() => expect(screen.getByText(/Definir os nomes dos noivos/i)).toBeInTheDocument());

    expect(screen.getByText(/Definir os nomes dos noivos/i).closest('a')).toHaveAttribute(
      'href',
      '/admin/configuracoes#noivos'
    );
    expect(screen.getByText(/Adicionar pelo menos uma Pergunta Frequente/i).closest('a')).toHaveAttribute(
      'href',
      '/admin/configuracoes#faq'
    );
  });

  it('linka o item de agenda pra /admin/agenda, não pra uma âncora em Configurações', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      id: 1,
      evento_id: 'evento-1',
      ...DEFAULT_CONFIG,
      created_at: '2026-01-01T00:00:00.000Z',
      data_casamento: '2026-06-30',
    });
    setupCounts(0, 0, 0);

    render(<SetupChecklist eventId="evento-1" />);
    await waitFor(() => expect(screen.getByText(/Adicionar pelo menos um item na agenda do dia/i)).toBeInTheDocument());

    expect(screen.getByText(/Adicionar pelo menos um item na agenda do dia/i).closest('a')).toHaveAttribute(
      'href',
      '/admin/agenda'
    );
  });
});
