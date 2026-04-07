import { render, screen, fireEvent } from '@testing-library/react';
import AdminLogin from '../page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Admin Login Page', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_ADMIN_PASSWORD: 'testpassword' };
    // Clear cookies
    document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('deve exibir o formulário de login inicialmente', () => {
    render(<AdminLogin />);
    expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Senha/i)).toBeInTheDocument();
  });

  test('deve exibir erro se a senha estiver incorreta', () => {
    render(<AdminLogin />);
    const input = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(input, { target: { value: 'wrongpassword' } });
    fireEvent.click(button);

    expect(screen.getByText(/Senha incorreta/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('deve redirecionar para o dashboard se a senha estiver correta', () => {
    render(<AdminLogin />);
    const input = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(input, { target: { value: 'testpassword' } });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    expect(document.cookie).toContain('admin-auth=testpassword');
  });

  test('deve redirecionar se já estiver autenticado via cookie', () => {
    document.cookie = 'admin-auth=testpassword; path=/';
    render(<AdminLogin />);
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });
});
