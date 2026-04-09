import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  refresh: jest.fn(),
}));

// Mock authService
jest.mock('@/lib/services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

describe('Admin Login Page', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  test('deve exibir o formulário de login inicialmente', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Acesso Organizador/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Senha/i)).toBeInTheDocument();
  });

  test('deve exibir erro se as credenciais estiverem incorretas', async () => {
    (authService.login as jest.Mock).mockResolvedValue(false);
    
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/E-mail/i);
    const passInput = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/E-mail ou senha incorretos/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('deve redirecionar para o dashboard se as credenciais estiverem corretas', async () => {
    (authService.login as jest.Mock).mockResolvedValue(true);
    
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/E-mail/i);
    const passInput = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passInput, { target: { value: 'testpassword' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
