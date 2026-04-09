import { render, screen, fireEvent } from '@testing-library/react';
import AdminLogin from '../page';

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('AdminLogin Error Branch', () => {
  test('deve limpar erro ao digitar novamente', () => {
    render(<AdminLogin />);
    const input = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(button);
    expect(screen.getByText(/Senha incorreta/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'a' } });
    expect(screen.queryByText(/Senha incorreta/i)).not.toBeInTheDocument();
  });
});
