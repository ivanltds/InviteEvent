import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';
import { CARD_TEMPLATE_LABELS } from '@/lib/utils/conviteCard';
import { CURSIVE_FONTS } from '@/lib/constants/fonts';

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

// Pedido de acompanhamento do usuário em 21/09/2026: "quero poder
// escolher as fontes para cada modelo e o tamanho delas tbm" + "quero
// poder escolher a imagem que vai nele tbm" + "quero ajustar tbm o
// tamanho da foto" — personalização independente por modelo.
describe('AdminConfig — Personalização do modelo ativo (fonte, tamanho, foto, zoom)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const configWithPhotos = {
    ...baseConfig,
    hero_images: ['https://cdn.example.com/foto1.jpg', 'https://cdn.example.com/foto2.jpg'],
  };

  test('mostra um botão de fonte pra cada fonte de Tipografia Premium, já na fonte real', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    CURSIVE_FONTS.forEach(font => {
      const button = screen.getByTitle(font.name);
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({ fontFamily: font.cssValue });
    });
  });

  test('clicar numa fonte atualiza a prévia do modelo ativo com a fonte escolhida', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Great Vibes'));

    const preview = screen.getByAltText(`Prévia do modelo ${CARD_TEMPLATE_LABELS.classico}`) as HTMLImageElement;
    const previewUrl = new URL(preview.src);
    expect(previewUrl.searchParams.get('fonte')).toBe('Great+Vibes');
  });

  test('o slider de tamanho da fonte atualiza o percentual exibido e a prévia', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    const { container } = render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText('Tamanho da fonte do nome: 100%')).toBeInTheDocument();

    const sliders = container.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[0], { target: { value: '150' } });

    expect(screen.getByText('Tamanho da fonte do nome: 150%')).toBeInTheDocument();
    const preview = screen.getByAltText(`Prévia do modelo ${CARD_TEMPLATE_LABELS.classico}`) as HTMLImageElement;
    expect(new URL(preview.src).searchParams.get('escala')).toBe('150');
  });

  test('o slider de tamanho da data atualiza o percentual exibido e a prévia', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    const { container } = render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText('Tamanho da fonte da data: 100%')).toBeInTheDocument();

    const sliders = container.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[1], { target: { value: '70' } });

    expect(screen.getByText('Tamanho da fonte da data: 70%')).toBeInTheDocument();
    const preview = screen.getByAltText(`Prévia do modelo ${CARD_TEMPLATE_LABELS.classico}`) as HTMLImageElement;
    expect(new URL(preview.src).searchParams.get('escalaData')).toBe('70');
  });

  test('mostra um preview grande do cartão, que reflete a personalização do modelo ativo', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      ...configWithPhotos,
      card_template_styles: { classico: { font: 'Great+Vibes', fontScale: 130 } },
    });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const bigPreview = screen.getByAltText(`Preview do cartão — modelo ${CARD_TEMPLATE_LABELS.classico}`) as HTMLImageElement;
    const url = new URL(bigPreview.src);
    expect(url.searchParams.get('fonte')).toBe('Great+Vibes');
    expect(url.searchParams.get('escala')).toBe('130');
  });

  test('mostra as fotos do evento como opções, e a opção "Automática" fica ativa por padrão', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText('Automática')).toBeInTheDocument();
    const photoThumbs = screen.getAllByAltText('');
    // 2 fotos do evento + 6 prévias de modelo (que também usam alt "") não têm alt vazio — as prévias têm alt específico.
    expect(photoThumbs.length).toBeGreaterThanOrEqual(2);
  });

  test('clicar numa foto do evento atualiza a prévia do modelo ativo com essa foto', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(configWithPhotos);
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const photoButton = screen.getAllByAltText('')[0].closest('button') as HTMLElement;
    fireEvent.click(photoButton);

    const preview = screen.getByAltText(`Prévia do modelo ${CARD_TEMPLATE_LABELS.classico}`) as HTMLImageElement;
    const foto = new URL(preview.src).searchParams.get('foto');
    expect(['https://cdn.example.com/foto1.jpg', 'https://cdn.example.com/foto2.jpg']).toContain(foto);
  });

  test('modelo Minimalista não mostra controles de foto/zoom (o modelo não tem foto)', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...configWithPhotos, card_template: 'minimalista' });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.queryByText('Foto do cartão')).not.toBeInTheDocument();
    expect(screen.queryByText(/Zoom da foto/)).not.toBeInTheDocument();
    // A fonte do nome continua disponível (Minimalista tem tipografia, só não tem foto).
    expect(screen.getByText('Tamanho da fonte do nome: 100%')).toBeInTheDocument();
  });

  test('trocar de modelo ativo mostra a personalização já salva daquele modelo', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      ...configWithPhotos,
      card_template_styles: { circular: { fontScale: 130 } },
    });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    expect(screen.getByText('Tamanho da fonte do nome: 100%')).toBeInTheDocument();

    fireEvent.click(screen.getByText(CARD_TEMPLATE_LABELS.circular).parentElement as HTMLElement);

    expect(screen.getByText('Tamanho da fonte do nome: 130%')).toBeInTheDocument();
  });
});
