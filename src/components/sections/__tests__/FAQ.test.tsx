import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FAQ from '../FAQ';

describe('FAQ Component', () => {
  it('should render all questions after loading', async () => {
    render(<FAQ />);
    
    await waitFor(() => {
      expect(screen.getByText('Crianças podem ir?')).toBeInTheDocument();
      expect(screen.getByText('Qual o traje do casamento?')).toBeInTheDocument();
    });
  });

  it('should toggle answer visibility when clicking a question', async () => {
    render(<FAQ />);
    
    await waitFor(() => screen.getByText('Crianças podem ir?'));
    
    const questionButton = screen.getByText('Crianças podem ir?');
    fireEvent.click(questionButton);
    
    expect(screen.getByText(/Sim! Crianças são muito bem-vindas/i)).toBeVisible();
  });
});
