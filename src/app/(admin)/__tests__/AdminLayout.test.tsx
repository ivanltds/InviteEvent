import { render, screen } from '@testing-library/react';
import AdminLayout from '../layout';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/admin/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/admin/convidados');
    // Limpa cookies
    document.cookie = 'admin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  test('não deve mostrar sidebar se não autorizado', () => {
    render(<AdminLayout><div>Content</div></AdminLayout>);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  test('deve mostrar sidebar se autorizado e não na página de login', () => {
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD = 'password';
    document.cookie = 'admin-auth=password';
    
    render(<AdminLayout><div>Content</div></AdminLayout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  test('não deve mostrar sidebar na página de login mesmo autorizado', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin');
    document.cookie = 'admin-auth=password';
    
    render(<AdminLayout><div>Content</div></AdminLayout>);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
