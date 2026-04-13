import { galleryService } from '@/lib/services/galleryService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'token' } } })
    }
  },
}));

describe('galleryService (STORY-045)', () => {
  const mockEventId = 'e1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch albums only for the given event_id', async () => {
    const mockData = [{ id: 'a1', nome: 'Album 1' }];
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    });

    const albums = await galleryService.getAlbums(mockEventId);
    expect(albums).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('galeria_albuns');
  });

  it('should create an album correctly', async () => {
    const mockAlbum = { id: 'a1', nome: 'Novo Album', evento_id: mockEventId };
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAlbum, error: null }),
        }),
      }),
    });

    const result = await galleryService.createAlbum(mockEventId, 'Novo Album');
    expect(result).toEqual(mockAlbum);
  });
});
