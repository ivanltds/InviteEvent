import { render, screen, waitFor } from '@testing-library/react';
import AdminLayout from '../layout';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
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
