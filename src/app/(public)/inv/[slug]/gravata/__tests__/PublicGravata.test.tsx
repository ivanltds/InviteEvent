import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicGravataPage from '../page';
import { rsvpService } from '@/lib/services/rsvpService';
import { configService } from '@/lib/services/configService';

jest.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'ana-e-carlos' }),
}));

jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: { getInviteBySlug: jest.fn() },
}));

jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn() },
}));

const baseInvite = { id: 'c1', evento_id: 'e1', slug: 'ana-e-carlos', nome_principal: 'Ana' };
const baseConfig = {
  id: 1,
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  data_casamento: '2026-06-13',
  gravata_recado: 'Sua presença já é o nosso maior presente!',
  pix_chave: '11999999999',
  pix_nome: 'Ana Carlos',
  pix_tipo: 'telefone' as const,
};

describe('PublicGravataPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
  });

  it('mostra o recado dos noivos e o QR code quando a chave PIX está cadastrada', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(baseInvite);
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);

    render(<PublicGravataPage />);

    await waitFor(() => expect(screen.getByText(/Sua presença já é o nosso maior presente!/i)).toBeInTheDocument());
    expect(screen.getByRole('img', { name: /QR Code para pagamento via PIX/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar Código PIX/i })).toBeInTheDocument();
  });

  it('copia o código PIX ao clicar no botão', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(baseInvite);
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);

    render(<PublicGravataPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar Código PIX/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Copiar Código PIX/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('br.gov.bcb.pix'));
    await waitFor(() => expect(screen.getByText(/Código Copiado/i)).toBeInTheDocument());
  });

  it('mostra "em breve" (sem QR code nem erro) quando o casal não cadastrou a chave PIX', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(baseInvite);
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...baseConfig, pix_chave: '' });

    render(<PublicGravataPage />);

    await waitFor(() => expect(screen.getByText(/em breve/i)).toBeInTheDocument());
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/erro/i)).not.toBeInTheDocument();
  });

  it('mostra "convite não encontrado" para um slug inválido', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(null);

    render(<PublicGravataPage />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
  });

  it('não mostra chips de valor quando não há valores sugeridos cadastrados', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(baseInvite);
    (configService.getConfig as jest.Mock).mockResolvedValue(baseConfig);

    render(<PublicGravataPage />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar Código PIX/i })).toBeInTheDocument());
    expect(screen.queryByText(/Quanto você gostaria de contribuir/i)).not.toBeInTheDocument();
  });

  it('ao escolher um valor sugerido, o payload PIX passa a incluir esse valor', async () => {
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(baseInvite);
    (configService.getConfig as jest.Mock).mockResolvedValue({
      ...baseConfig,
      gravata_valores_sugeridos: [50, 100, 200],
    });

    render(<PublicGravataPage />);
    await waitFor(() => expect(screen.getByText(/Quanto você gostaria de contribuir/i)).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /R\$\s*50/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /R\$\s*100/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /R\$\s*200/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /R\$\s*100/ }));

    // O valor de R$ 100,00 deve aparecer na instrução do PixPanel
    await waitFor(() => expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument());

    // Clicar de novo no mesmo valor desmarca (volta pro valor livre)
    fireEvent.click(screen.getByRole('button', { name: /R\$\s*100/ }));
    await waitFor(() => expect(screen.getByText(/Escolha o valor que quiser contribuir/i)).toBeInTheDocument());
  });
});
