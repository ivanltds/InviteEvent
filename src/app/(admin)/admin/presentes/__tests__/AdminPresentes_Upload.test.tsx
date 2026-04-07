import { render, screen, waitFor } from '@testing-library/react';
import AdminPresentes from '../page';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [{ id: '1' }], error: null })),
    })),
  },
}));

// Mock do next-cloudinary (simulando o widget que ainda não existe no código)
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onUpload }: any) => {
    // Simula o clique que dispararia o upload
    return children({ open: () => onUpload({ info: { secure_url: 'https://cloudinary.com/test.jpg' } }) });
  },
}));

describe('Admin Presentes - Upload Integration (TDD)', () => {
  it('should have an upload button that updates the image URL field', async () => {
    render(<AdminPresentes />);
    
    // Abre o modal de novo item
    const addBtn = screen.getByText(/Novo Item/i);
    addBtn.click();
    
    // O teste deve FALHAR inicialmente porque o formulário usa um <input text> simples para URL
    // e não o CldUploadWidget.
    await waitFor(() => {
      const uploadBtn = screen.getByText(/Subir Foto/i);
      expect(uploadBtn).toBeInTheDocument();
    });
  });
});
