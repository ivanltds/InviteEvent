import { render, screen, waitFor } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { useEvent } from '@/lib/contexts/EventContext';
import { configService } from '@/lib/services/configService';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

// Mock do configService
jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
  },
}));

// Mock do navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: jest.fn() })
}));

describe('Admin Sidebar Component (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
      events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
      loading: false,
      userProfile: { id: 'u1', is_master: true }
    });
    (configService.getConfig as jest.Mock).mockResolvedValue({ 
      noiva_nome: 'Noiva Teste', 
      noivo_nome: 'Noivo Teste' 
    });
  });

  it('should display the couple initials or names from database instead of hardcoded L & M', async () => {
    render(<Sidebar />);
    
    await waitFor(() => {
      const initials = screen.getByText(/N & N/i);
      expect(initials).toBeInTheDocument();
    });
  });
});
