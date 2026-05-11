import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { muralService } from '@/lib/services/muralService';
import MuralModeration from '@/components/admin/MuralModeration';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/services/muralService');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null })
  }
}));

const mockItems = [
  {
    id: '1',
    evento_id: 'event-1',
    tipo: 'FOTO',
    url_midia: 'http://example.com/photo.jpg',
    mensagem: 'Great photo!',
    autor: 'John Doe',
    aprovado: false,
    criado_em: '2023-01-01'
  },
  {
    id: '2',
    evento_id: 'event-1',
    tipo: 'VIDEO',
    url_midia: 'http://example.com/video.mp4',
    mensagem: 'Awesome video!',
    autor: 'Jane Smith',
    aprovado: true,
    criado_em: '2023-01-02'
  }
];

describe('MuralModeration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (muralService.getItemsForModeration as jest.Mock).mockResolvedValue(mockItems);
  });

  it('renders loading state initially', () => {
    render(<MuralModeration eventId="event-1" />);
    expect(screen.getByText('Carregando itens do mural...')).toBeInTheDocument();
  });

  it('renders photos and videos after loading', async () => {
    render(<MuralModeration eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Great photo!')).toBeInTheDocument();
      expect(screen.getByText('Awesome video!')).toBeInTheDocument();
    });
  });

  it('calls updateItemStatus when approve button is clicked', async () => {
    (muralService.updateItemStatus as jest.Mock).mockResolvedValue(true);
    
    render(<MuralModeration eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Aprovar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aprovar'));
    
    await waitFor(() => {
      expect(muralService.updateItemStatus).toHaveBeenCalledWith('1', true);
    });
  });

  it('calls deleteItem when delete button is clicked and confirmed', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    (muralService.deleteItem as jest.Mock).mockResolvedValue(true);
    
    render(<MuralModeration eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Excluir')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Excluir')[0]);
    
    // Click confirm button in the modal that opened
    await waitFor(() => expect(screen.getByText('Sim, Excluir')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sim, Excluir'));
    
    await waitFor(() => {
      expect(muralService.deleteItem).toHaveBeenCalledWith('1');
    });
  });
});
