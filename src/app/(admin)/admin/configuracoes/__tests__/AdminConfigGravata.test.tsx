import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

// Referência estável de propósito: o componente refaz o fetch de config
// sempre que a identidade de `currentEvent` muda (useEffect com
// [currentEvent, eventLoading]); um objeto novo a cada chamada do mock
// dispararia um refetch a cada re-render (inclusive por um simples
// clique de rádio), fazendo a tela voltar para "Carregando..." bem no
// meio das asserções.
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
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
  modo_arrecadacao: 'presentes' as const,
  gravata_label: 'quero_colaborar' as const,
  gravata_recado: '',
  pix_chave: '',
};

describe('AdminConfig — Gravata dos Noivos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('mostra os 3 modos de arrecadação, com Presentes selecionado por padrão', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByLabelText('Lista de Presentes')).toBeChecked();
    expect(screen.getByLabelText('Gravata dos Noivos')).not.toBeChecked();
    expect(screen.getByLabelText('Nenhum')).not.toBeChecked();
    // Campos da gravata não aparecem enquanto o modo não for selecionado
    expect(screen.queryByLabelText(/Recado para os convidados/i)).not.toBeInTheDocument();
  });

  test('ao escolher Gravata dos Noivos, mostra preset de label e recado editável', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, pix_chave: '11999999999' });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Gravata dos Noivos'));

    expect(screen.getByLabelText('Quero presentear')).toBeInTheDocument();
    expect(screen.getByLabelText('Quero colaborar')).toBeChecked(); // default do preset

    const recado = screen.getByLabelText(/Recado para os convidados/i);
    fireEvent.change(recado, { target: { value: 'Novo recado do casal' } });
    expect(recado).toHaveValue('Novo recado do casal');

    // Chave PIX cadastrada: não deve mostrar o aviso
    expect(screen.queryByText(/Chave PIX não cadastrada/i)).not.toBeInTheDocument();
  });

  test('avisa quando Gravata é escolhida sem chave PIX cadastrada', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, pix_chave: '' });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Gravata dos Noivos'));

    expect(screen.getByText(/Chave PIX não cadastrada/i)).toBeInTheDocument();
  });

  // Pedido do usuário em 21/09/2026: "texto para o botão da gravata dos
  // noivos deve ser configuravel com as opçõs, mas tbm ter uma caixa de
  // texto com tamanho limitado."
  test('ao escolher "Personalizado", mostra uma caixa de texto com contador e limite de caracteres', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, pix_chave: '11999999999' });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Gravata dos Noivos'));
    expect(screen.queryByPlaceholderText(/Ajude nossa lua de mel/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Personalizado'));

    const input = screen.getByPlaceholderText(/Ajude nossa lua de mel/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.maxLength).toBe(30);
    expect(screen.getByText('0/30 caracteres')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Ajude na lua de mel' } });
    expect(input).toHaveValue('Ajude na lua de mel');
    expect(screen.getByText('19/30 caracteres')).toBeInTheDocument();
  });

  test('a caixa de texto personalizado some ao trocar de volta pra um preset', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      ...baseConfig,
      pix_chave: '11999999999',
      gravata_label: 'personalizado' as const,
      gravata_label_personalizado: 'Contribua com a lua de mel',
    });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Gravata dos Noivos'));
    expect(screen.getByDisplayValue('Contribua com a lua de mel')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Quero colaborar'));
    expect(screen.queryByDisplayValue('Contribua com a lua de mel')).not.toBeInTheDocument();
  });

  test('Presentes e Gravata são mutuamente exclusivos', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Gravata dos Noivos'));
    expect(screen.getByLabelText('Gravata dos Noivos')).toBeChecked();
    expect(screen.getByLabelText('Lista de Presentes')).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Nenhum'));
    expect(screen.getByLabelText('Nenhum')).toBeChecked();
    expect(screen.getByLabelText('Gravata dos Noivos')).not.toBeChecked();
    // Voltando pra "Nenhum", os campos da gravata somem de novo
    expect(screen.queryByLabelText(/Recado para os convidados/i)).not.toBeInTheDocument();
  });
});
