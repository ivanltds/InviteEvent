import { render, screen } from '@testing-library/react';
import Historia from '../Historia';
import OsNoivos from '../OsNoivos';
import Detalhes from '../Detalhes';

const mockConfig = {
  historia_titulo: 'Título Teste',
  historia_subtitulo: 'Sub Teste',
  historia_texto: 'Era uma vez...',
  historia_conclusao: 'Fim.',
  noiva_nome: 'Layslla',
  noivo_nome: 'Marcus',
  noiva_bio: 'Bio da Noiva Teste',
  noivo_bio: 'Bio do Noivo Teste',
  noivos_conclusao: 'Conclusão Casal',
  data_casamento: '2026-06-13'
};

describe('Site Sections (Public)', () => {
  test('Historia deve carregar dados da prop config', () => {
    render(<Historia config={mockConfig as any} />);
    expect(screen.getByText('Título Teste')).toBeInTheDocument();
    expect(screen.getByText('Sub Teste')).toBeInTheDocument();
  });

  test('OsNoivos deve carregar bios da prop config', () => {
    render(<OsNoivos config={mockConfig as any} />);
    expect(screen.getByText('Bio da Noiva Teste')).toBeInTheDocument();
    expect(screen.getByText('Bio do Noivo Teste')).toBeInTheDocument();
  });

  test('Detalhes deve renderizar informações da prop config', () => {
    render(<Detalhes config={mockConfig as any} />);
    expect(screen.getByText(/O Evento/i)).toBeInTheDocument();
    expect(screen.getByText(/Cerimônia/i)).toBeInTheDocument();
    expect(screen.getByText(/Recepção/i)).toBeInTheDocument();
  });

  // Correção de 20/09/2026: os campos local_cerimonia/endereco_cerimonia
  // eram editáveis em Configurações mas o componente que os exibe nunca
  // era renderizado no convite — o usuário reportou "a seção que tem os
  // endereços não ta aparecendo pros convidados".
  test('Detalhes mostra links de Google Maps e Waze a partir do endereço da cerimônia', () => {
    render(<Detalhes config={{ ...mockConfig, endereco_cerimonia: 'Av. Paulista, 1000' } as any} />);

    const mapsLink = screen.getByText('Google Maps').closest('a');
    const wazeLink = screen.getByText('Waze').closest('a');
    expect(mapsLink).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(mapsLink).toHaveAttribute('href', expect.stringContaining('Av.%20Paulista'));
    expect(wazeLink).toHaveAttribute('href', expect.stringContaining('waze.com'));
  });

  test('Detalhes não mostra links de mapa sem endereço nem local cadastrado', () => {
    render(<Detalhes config={{ ...mockConfig, endereco_cerimonia: undefined, local_cerimonia: undefined } as any} />);
    expect(screen.queryByText('Google Maps')).not.toBeInTheDocument();
    expect(screen.queryByText('Waze')).not.toBeInTheDocument();
  });
});
