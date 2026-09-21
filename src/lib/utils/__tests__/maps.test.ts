import {
  buildGoogleMapsUrl,
  buildWazeUrl,
  resolveGoogleMapsUrl,
  resolveWazeUrl,
  buildGoogleMapsEmbedUrl,
  resolveGoogleMapsEmbedUrl,
} from '../maps';

describe('maps utils', () => {
  it('gera URL de busca do Google Maps a partir de um endereço', () => {
    expect(buildGoogleMapsUrl('Av. Paulista, 1000')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Av.%20Paulista%2C%201000'
    );
  });

  it('gera URL de navegação do Waze a partir de um endereço', () => {
    expect(buildWazeUrl('Av. Paulista, 1000')).toBe(
      'https://waze.com/ul?q=Av.%20Paulista%2C%201000&navigate=yes'
    );
  });

  describe('resolveGoogleMapsUrl', () => {
    it('usa o link manual quando cadastrado', () => {
      expect(resolveGoogleMapsUrl('Av. Paulista, 1000', 'https://maps.google.com/custom')).toBe(
        'https://maps.google.com/custom'
      );
    });

    it('cai para o link gerado do endereço quando não há link manual', () => {
      expect(resolveGoogleMapsUrl('Av. Paulista, 1000', undefined)).toBe(
        buildGoogleMapsUrl('Av. Paulista, 1000')
      );
    });

    it('ignora link manual em branco e usa o endereço', () => {
      expect(resolveGoogleMapsUrl('Av. Paulista, 1000', '   ')).toBe(buildGoogleMapsUrl('Av. Paulista, 1000'));
    });

    it('retorna null sem endereço e sem link manual', () => {
      expect(resolveGoogleMapsUrl(undefined, undefined)).toBeNull();
    });
  });

  describe('resolveWazeUrl', () => {
    it('usa o link manual quando cadastrado', () => {
      expect(resolveWazeUrl('Av. Paulista, 1000', 'https://waze.com/custom')).toBe('https://waze.com/custom');
    });

    it('cai para o link gerado do endereço quando não há link manual', () => {
      expect(resolveWazeUrl('Av. Paulista, 1000', undefined)).toBe(buildWazeUrl('Av. Paulista, 1000'));
    });

    it('retorna null sem endereço e sem link manual', () => {
      expect(resolveWazeUrl('', undefined)).toBeNull();
    });
  });

  describe('buildGoogleMapsEmbedUrl / resolveGoogleMapsEmbedUrl', () => {
    it('gera URL de mapa incorporável (output=embed), sem exigir chave de API', () => {
      expect(buildGoogleMapsEmbedUrl('Av. Paulista, 1000')).toBe(
        'https://www.google.com/maps?q=Av.%20Paulista%2C%201000&output=embed'
      );
    });

    it('resolve a partir do endereço/local informado', () => {
      expect(resolveGoogleMapsEmbedUrl('Chácara Fiorese')).toBe(buildGoogleMapsEmbedUrl('Chácara Fiorese'));
    });

    it('retorna null sem endereço nem local', () => {
      expect(resolveGoogleMapsEmbedUrl(undefined)).toBeNull();
      expect(resolveGoogleMapsEmbedUrl('   ')).toBeNull();
    });
  });
});
