import { render, screen, waitFor } from '@testing-library/react';
import Countdown from '../Countdown';

describe('Countdown Component', () => {
  it('should display remaining time after initial mount', async () => {
    // Define uma data no futuro
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const targetDate = futureDate.toISOString();

    render(<Countdown targetDate={targetDate} />);
    
    // O Countdown começa como null e atualiza no primeiro useEffect (timeout 0)
    await waitFor(() => {
      // Verifica se o número de dias (9 ou 10) aparece
      const days = screen.getByText(/dia/i);
      expect(days).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display zeros if date is in the past', async () => {
    const pastDate = '2020-01-01T00:00:00';
    render(<Countdown targetDate={pastDate} />);
    
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
  });
});
