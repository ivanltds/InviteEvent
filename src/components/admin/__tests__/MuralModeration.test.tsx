import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MuralModeration from '@/components/admin/MuralModeration';
import { muralService } from '@/lib/services/muralService';

jest.mock('@/lib/services/muralService');

const mockPhotos = [
  {
    id: '1',
    event_id: 'event-1',
    url_foto: 'https://example.com/photo1.jpg',
    legenda: 'Legenda 1',
    guest_name: 'Convidado 1',
    is_approved: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    event_id: 'event-1',
    url_foto: 'https://example.com/photo2.jpg',
    legenda: 'Legenda 2',
    guest_name: 'Convidado 2',
    is_approved: true,
    created_at: new Date().toISOString()
  }
];

describe('MuralModeration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (muralService.getPhotosForModeration as jest.Mock).mockResolvedValue(mockPhotos);
  });

  it('renders pending photos', async () => {
    render(<MuralModeration eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Convidado 1')).toBeInTheDocument();
      expect(screen.getByText('Legenda 1')).toBeInTheDocument();
    });
  });

  it('allows approving a photo', async () => {
    (muralService.updatePhotoStatus as jest.Mock).mockResolvedValue(true);
    
    render(<MuralModeration eventId="event-1" />);
    
    await waitFor(() => {
      const approveButtons = screen.getAllByText('Aprovar');
      fireEvent.click(approveButtons[0]);
    });

    expect(muralService.updatePhotoStatus).toHaveBeenCalledWith('1', true);
  });
});
