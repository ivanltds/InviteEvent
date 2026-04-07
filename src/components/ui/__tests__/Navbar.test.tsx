import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

describe('Navbar Component', () => {
  test('deve renderizar o logo e links de navegação', () => {
    render(<Navbar />);
    
    expect(screen.getByText('L & M')).toBeInTheDocument();
    expect(screen.getByText('Nossa História')).toBeInTheDocument();
    expect(screen.getByText('O Evento')).toBeInTheDocument();
    expect(screen.getByText('RSVP')).toBeInTheDocument();
    expect(screen.getByText('Presentes')).toBeInTheDocument();
  });
});
