import { render, screen, fireEvent } from '@testing-library/react';
import AdminLogin from '../page';

describe('Admin Login Page', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_ADMIN_PASSWORD: 'testpassword' };
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
  });

  test('deve autorizar e mostrar o dashboard se a senha estiver correta', () => {
    render(<AdminLogin />);
    const input = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(input, { target: { value: 'testpassword' } });
    fireEvent.click(button);

    expect(screen.getByText(/Dashboard Geral/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão de Convidados/i)).toBeInTheDocument();
  });
});
