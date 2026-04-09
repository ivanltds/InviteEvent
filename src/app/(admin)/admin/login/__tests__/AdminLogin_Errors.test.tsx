import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { authService } from '@/lib/services/authService';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock authService
jest.mock('@/lib/services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

describe('LoginPage Error Branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve limpar erro ao digitar novamente', async () => {
    (authService.login as jest.Mock).mockResolvedValue(false);
    
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/E-mail/i);
    const passInput = screen.getByPlaceholderText(/Senha/i);
    const button = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passInput, { target: { value: 'wrong' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/E-mail ou senha incorretos/i)).toBeInTheDocument();
    });

    fireEvent.change(passInput, { target: { value: 'a' } });
    await waitFor(() => {
      expect(screen.queryByText(/E-mail ou senha incorretos/i)).not.toBeInTheDocument();
    });
  });
});
