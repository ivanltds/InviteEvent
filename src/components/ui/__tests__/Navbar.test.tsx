import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Navbar Component', () => {
  test('deve renderizar o logo e links de navegação', () => {
    (usePathname as jest.Mock).mockReturnValue('/inv/test');
    render(<Navbar />);
    
    expect(screen.getByText('L & M')).toBeInTheDocument();
    expect(screen.getByText('Nossa História')).toBeInTheDocument();
    expect(screen.getByText('O Evento')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Presença')).toBeInTheDocument();
    expect(screen.queryByText('Presentes')).not.toBeInTheDocument();
  });
});
