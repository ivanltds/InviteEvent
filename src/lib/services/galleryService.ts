import { supabase } from '@/lib/supabase';

export interface Album {
  id: string;
  evento_id: string;
  nome: string;
  descricao?: string;
  capa_url?: string;
  ordem: number;
}

export interface Foto {
  id: string;
  album_id: string;
  evento_id: string;
  url: string;
  public_id: string;
  legenda?: string;
  largura?: number;
  altura?: number;
}

export const galleryService = {
  async getAlbums(eventoId: string): Promise<Album[]> {
    const { data } = await supabase
      .from('galeria_albuns')
      .select('*')
      .eq('evento_id', eventoId)
      .order('ordem', { ascending: true });
    return data || [];
  },

  async createAlbum(eventoId: string, nome: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from('galeria_albuns')
      .insert([{ evento_id: eventoId, nome }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAlbum(albumId: string): Promise<boolean> {
    const { error } = await supabase.from('galeria_albuns').delete().eq('id', albumId);
    return !error;
  },

  async getPhotos(albumId: string): Promise<Foto[]> {
    const { data } = await supabase
      .from('galeria_fotos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async addPhoto(photo: Omit<Foto, 'id'>): Promise<Foto | null> {
    const { data, error } = await supabase
      .from('galeria_fotos')
      .insert([photo])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePhoto(photoId: string): Promise<boolean> {
    const { error } = await supabase.from('galeria_fotos').delete().eq('id', photoId);
    return !error;
  },

  async getSignature(eventId: string, folder: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/media/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ eventId, folder })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao obter assinatura de upload');
    return data;
  }
};
