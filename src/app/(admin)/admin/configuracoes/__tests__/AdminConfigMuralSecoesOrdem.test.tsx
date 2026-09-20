import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

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
  mostrar_mural: true,
  secoes_ordem: ['historia', 'noivos', 'agenda', 'rsvp', 'faq'],
};

describe('AdminConfig — Mural opcional e ordem das seções', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('checkbox do Mural vem marcada por padrão e pode ser desmarcada', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const checkbox = screen.getByLabelText(/Mural de Lembranças/i);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('mostra as seções na ordem salva, numeradas', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      ...baseConfig,
      secoes_ordem: ['faq', 'historia', 'noivos', 'agenda', 'rsvp'],
    });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText(/1\. Perguntas Frequentes \(FAQ\)/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Nossa História/)).toBeInTheDocument();
  });

  test('mover uma seção para baixo troca sua posição na lista', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText(/1\. Nossa História/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Os Noivos \(Bio\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Mover Nossa História para baixo'));

    expect(screen.getByText(/1\. Os Noivos \(Bio\)/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Nossa História/)).toBeInTheDocument();
  });

  test('botão de mover para cima fica desabilitado no primeiro item', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByLabelText('Mover Nossa História para cima')).toBeDisabled();
    expect(screen.getByLabelText('Mover Perguntas Frequentes (FAQ) para baixo')).toBeDisabled();
  });
});
