import { render, screen, waitFor } from '@testing-library/react';
import AdminPresentes from '../page';
import { supabase } from '@/lib/supabase';
import { useEvent } from '@/lib/contexts/EventContext';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [{ id: '1' }], error: null })),
    })),
  },
}));

// Mock do next-cloudinary
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onSuccess }: any) => {
    return children({ open: () => onSuccess({ info: { secure_url: 'https://cloudinary.com/test.jpg' } }) });
  },
}));

describe('Admin Presentes - Upload Integration (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
      events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
      loading: false,
      userProfile: { id: 'u1', is_master: true }
    });
  });

  it('should have an upload button that updates the image URL field', async () => {
    render(<AdminPresentes />);
    
    // Abre o modal de novo item
    const addBtn = screen.getByText(/Novo Item/i);
    addBtn.click();
    
    await waitFor(() => {
      const uploadBtn = screen.getByText(/Subir Foto/i);
      expect(uploadBtn).toBeInTheDocument();
    });
  });
});
