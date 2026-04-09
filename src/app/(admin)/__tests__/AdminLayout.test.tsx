import { render, screen, waitFor } from '@testing-library/react';
import AdminLayout from '../layout';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { eventService } from '@/lib/services/eventService'; // Import eventService

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }),
    },
    from: jest.fn().mockImplementation((table) => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
        then: jest.fn(), // This `then` will be called if no .single() or .maybeSingle() is used after select()
      };

      if (table === 'perfis') {
        mockSelect.single.mockResolvedValue({ data: { id: 'u1', is_master: true }, error: null });
        mockSelect.maybeSingle.mockResolvedValue({ data: { id: 'u1', is_master: true }, error: null });
        mockSelect.then.mockResolvedValue({ data: [{ id: 'u1', is_master: true }], error: null });
      } else if (table === 'eventos') {
        mockSelect.single.mockResolvedValue({ data: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }, error: null });
        mockSelect.maybeSingle.mockResolvedValue({ data: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }, error: null });
        // eventService.getMyEvents() calls select().order(). The .then() on select() is what gets called.
        mockSelect.then.mockResolvedValue({ data: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }], error: null });
      } else {
        // Default for other tables
        mockSelect.single.mockResolvedValue({ data: null, error: null });
        mockSelect.maybeSingle.mockResolvedValue({ data: null, error: null });
        mockSelect.then.mockResolvedValue({ data: [], error: null });
      }

      return {
        select: jest.fn(() => mockSelect),
      };
    })
  },
}));

// Mock the eventService directly
jest.mock('@/lib/services/eventService', () => ({
  eventService: {
    getMyEvents: jest.fn(),
    createEvent: jest.fn(),
    getOrganizers: jest.fn(),
    addOrganizer: jest.fn(),
    removeOrganizer: jest.fn(),
    transferOwnership: jest.fn(),
  },
}));

jest.mock('@/components/admin/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

describe('AdminLayout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/admin/convidados');
    process.env = { ...originalEnv, NEXT_PUBLIC_ADMIN_PASSWORD: 'password' };
    // Limpa cookies
    document.cookie = 'admin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Explicitly mock getMyEvents
    eventService.getMyEvents.mockResolvedValue([
      { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }
    ]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('não deve mostrar sidebar se não autorizado', async () => {
    render(<AdminLayout><div>Content</div></AdminLayout>);
    await waitFor(() => {
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });

  test('deve mostrar sidebar se autorizado e não na página de login', async () => {
    document.cookie = 'admin-auth=password';
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    
    render(<AdminLayout><div>Content</div></AdminLayout>);
    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  test('não deve mostrar sidebar na página de login mesmo autorizado', async () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/login');
    document.cookie = 'admin-auth=password';
    
    render(<AdminLayout><div>Content</div></AdminLayout>);
    await waitFor(() => {
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });
});
