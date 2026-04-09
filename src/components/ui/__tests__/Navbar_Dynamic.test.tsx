import { render, screen, waitFor } from '@testing-library/react';
import Navbar from '../Navbar';
import { usePathname } from 'next/navigation';
import { configService } from '@/lib/services/configService';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
  },
}));

describe('Navbar Dynamic Items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getConfig as jest.Mock).mockResolvedValue({
      noiva_nome: 'Layslla',
      noivo_nome: 'Marcus'
    });
  });

  test('na Landing Page (/) deve mostrar o nome da ferramenta no logo', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    render(<Navbar />);
    
    expect(screen.getByText(/InviteEventAI/i)).toBeInTheDocument();
    expect(screen.queryByText('L & M')).not.toBeInTheDocument();
    // Links do convite NÃO devem aparecer
    expect(screen.queryByText(/Nossa História/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Confirmar Presença/i)).not.toBeInTheDocument();
    // Link de ADM/Criação deve aparecer como 'Criar Convite' na Landing
    expect(screen.getByText(/Criar Convite/i)).toBeInTheDocument();
  });

  test('na Página do Convite (/inv/slug) deve mostrar as iniciais dinâmicas do casal', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      noiva_nome: 'Ana',
      noivo_nome: 'Bruno'
    });
    (usePathname as jest.Mock).mockReturnValue('/inv/slug-teste');
    
    render(<Navbar />);
    
    await waitFor(() => {
      expect(screen.getByText('A & B')).toBeInTheDocument();
    });
    expect(screen.queryByText('InviteEventAI')).not.toBeInTheDocument();
    
    expect(screen.getByText(/Nossa História/i)).toBeInTheDocument();
    expect(screen.getByText(/O Evento/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmar Presença/i)).toBeInTheDocument();
  });

  test('na Área Admin não deve renderizar nada', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    const { container } = render(<Navbar />);
    expect(container.firstChild).toBeNull();
  });
});
