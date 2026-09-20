import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

// Referência estável de propósito — ver AdminConfigGravata.test.tsx:
// um objeto novo a cada chamada do mock dispara refetch a cada clique
// (useEffect depende da identidade de currentEvent).
const stableEventContext = {
  currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
  events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
  loading: false,
  userProfile: { id: 'u1', is_master: true },
};

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(() => stableEventContext),
}));

jest.mock('@/components/admin/FAQManager', () => () => <div data-testid="faq-manager">FAQ</div>);
jest.mock('@/components/admin/TeamManagement', () => () => <div data-testid="team-management">Team</div>);
jest.mock('@/components/admin/ConfigPreview', () => () => <div data-testid="preview">Preview</div>);

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

const baseConfig = {
  id: 1,
  noiva_nome: 'Layslla',
  noivo_nome: 'Marcus',
  data_casamento: '2026-06-13',
  modo_arrecadacao: 'gravata' as const,
  gravata_label: 'quero_colaborar' as const,
  pix_chave: '11999999999',
  gravata_valores_sugeridos: [50, 100],
};

describe('AdminConfig — valores sugeridos da Gravata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('mostra os valores já cadastrados e permite remover um', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Remover valor sugerido de 50/i));
    expect(screen.queryByText(/R\$\s*50,00/)).not.toBeInTheDocument();
    expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument();
  });

  test('adiciona um novo valor sugerido', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, gravata_valores_sugeridos: [] });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const input = screen.getByPlaceholderText('Ex: 100');
    fireEvent.change(input, { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Adicionar valor/i }));

    expect(screen.getByText(/R\$\s*250,00/)).toBeInTheDocument();
    expect(input).toHaveValue(null);
  });

  test('ignora valor vazio ou zero', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, gravata_valores_sugeridos: [] });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /\+ Adicionar valor/i }));
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});
