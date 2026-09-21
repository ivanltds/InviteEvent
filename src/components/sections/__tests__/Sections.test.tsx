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

  // Feedback do usuário em 20/09/2026: a Recepção deve aparecer antes da
  // Cerimônia, e o endereço (sendo o mesmo local para os dois) deve
  // aparecer uma única vez, fora dos cards de horário — não mais
  // duplicado (e às vezes com texto placeholder inconsistente) dentro
  // de cada card.
  test('mostra o card da Recepção antes do card da Cerimônia', () => {
    render(<Detalhes config={mockConfig as any} />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(headings).toEqual(['A Recepção', 'A Cerimônia']);
  });

  test('mostra o endereço uma única vez, fora dos cards, compartilhado pelos dois horários', () => {
    render(
      <Detalhes
        config={{
          ...mockConfig,
          local_cerimonia: 'Chácara Fiorese',
          endereco_cerimonia: 'Estr. Mun. do Carmo, 300, Vargem Grande Paulista - SP',
          horario_cerimonia: '13:00',
          horario_recepcao: '19:00',
        } as any}
      />
    );

    expect(screen.getAllByText('Chácara Fiorese')).toHaveLength(1);
    expect(screen.getAllByText('Estr. Mun. do Carmo, 300, Vargem Grande Paulista - SP')).toHaveLength(1);
    expect(screen.getByText('13:00')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
  });

  // Pedido do usuário em 20/09/2026: "quero mostrar um mapa com o
  // endereço" — além dos links pra abrir em outro app, o mapa aparece
  // incorporado (iframe) direto no convite.
  test('mostra um mapa incorporado com o endereço da cerimônia', () => {
    render(<Detalhes config={{ ...mockConfig, endereco_cerimonia: 'Av. Paulista, 1000' } as any} />);

    const iframe = screen.getByTitle(/Mapa de localização/i);
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('src', expect.stringContaining('google.com/maps'));
    expect(iframe).toHaveAttribute('src', expect.stringContaining('output=embed'));
    expect(iframe).toHaveAttribute('src', expect.stringContaining('Av.%20Paulista'));
  });

  test('não mostra o mapa incorporado sem endereço nem local cadastrado', () => {
    render(<Detalhes config={{ ...mockConfig, endereco_cerimonia: undefined, local_cerimonia: undefined } as any} />);
    expect(screen.queryByTitle(/Mapa de localização/i)).not.toBeInTheDocument();
  });
});
