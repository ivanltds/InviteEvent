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
  modo_convite: 'individual' as const,
};

describe('AdminConfig — Modo de Convite (Link Único)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('Convites Individuais é o padrão, sem aviso de duplicatas', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByLabelText(/Convites Individuais/i)).toBeChecked();
    expect(screen.queryByText(/Como funciona na prática/i)).not.toBeInTheDocument();
  });

  test('ao escolher Link Único, mostra o aviso sobre duplicatas', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Link Único/i));

    expect(screen.getByLabelText(/Link Único/i)).toBeChecked();
    expect(screen.getByLabelText(/Convites Individuais/i)).not.toBeChecked();
    expect(screen.getByText(/Como funciona na prática/i)).toBeInTheDocument();
    expect(screen.getByText(/pode aparecer duas vezes/i)).toBeInTheDocument();
  });
});
