import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';
import { CARD_TEMPLATE_LABELS } from '@/lib/utils/conviteCard';

/**
 * Pedido do usuário em 21/09/2026: "Preciso ter varios modelos de como
 * vai ser apresentado esse card nmo whatsapp... preciso de pelo menos 5"
 * + "deve ser sel3cionado em configurações". Ver CARD_TEMPLATES em
 * src/lib/utils/conviteCard.ts e src/app/api/og/convite/route.tsx.
 */

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
  card_template: 'classico',
};

describe('AdminConfig — Modelo do Cartão de Compartilhamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('mostra pelo menos 5 modelos de cartão, cada um com prévia e rótulo', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const labels = Object.values(CARD_TEMPLATE_LABELS);
    expect(labels.length).toBeGreaterThanOrEqual(5);
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    const previews = screen.getAllByAltText(/^Prévia do modelo /);
    expect(previews.length).toBe(labels.length);
  });

  test('modelo salvo (card_template) vem marcado como ativo ao carregar', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, card_template: 'circular' });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const circularOption = screen.getByText(CARD_TEMPLATE_LABELS.circular).parentElement;
    expect(circularOption).toHaveTextContent('✓');

    const classicoOption = screen.getByText(CARD_TEMPLATE_LABELS.classico).parentElement;
    expect(classicoOption).not.toHaveTextContent('✓');
  });

  test('clicar em outro modelo troca qual fica marcado como ativo', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const minimalistaOption = screen.getByText(CARD_TEMPLATE_LABELS.minimalista).parentElement as HTMLElement;
    expect(minimalistaOption).not.toHaveTextContent('✓');

    fireEvent.click(minimalistaOption);

    expect(minimalistaOption).toHaveTextContent('✓');
    const classicoOption = screen.getByText(CARD_TEMPLATE_LABELS.classico).parentElement;
    expect(classicoOption).not.toHaveTextContent('✓');
  });
});
