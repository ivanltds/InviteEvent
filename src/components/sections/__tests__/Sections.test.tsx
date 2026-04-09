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
});
