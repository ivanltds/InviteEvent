import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveInviteView from '../LiveInviteView';
import { Configuracao } from '@/lib/types/database';

// Seções pesadas mockadas — este teste cobre só a troca do botão de
// arrecadação (Lista de Presentes / Gravata dos Noivos / Nenhum),
// story final da feature (docs/analise/04b-guia-de-extensao.md).
jest.mock('@/components/sections/Historia', () => () => <div />);
jest.mock('@/components/sections/OsNoivos', () => () => <div />);
jest.mock('@/components/sections/Detalhes', () => () => <div />);
jest.mock('@/components/sections/FAQ', () => () => <div />);
jest.mock('@/components/sections/RSVP', () => () => <div />);
jest.mock('@/components/sections/AgendaSection', () => () => <div />);
jest.mock('@/components/sections/Countdown', () => () => <div />);
jest.mock('@/components/ui/HeroCarousel', () => () => <div />);
jest.mock('@/components/ui/LegalFooter', () => () => <div />);
jest.mock('@/hooks/useTrackSection', () => ({ useTrackSection: () => {} }));

const baseConfig: Configuracao = {
  id: 1,
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  data_casamento: '2026-06-13',
};

const baseProps = {
  couple: { noiva: 'Ana', noivo: 'Carlos', data: '13/06/2026', rawDate: '2026-06-13' },
  visibility: { historia: false, noivos: false, faq: false, presentes: true },
  agenda: [],
  slug: 'ana-e-carlos',
};

describe('LiveInviteView — botão de arrecadação', () => {
  it('mostra "Lista de Presentes" quando modo_arrecadacao é presentes (ou ausente)', () => {
    render(<LiveInviteView {...baseProps} config={baseConfig} />);
    expect(screen.getByRole('link', { name: 'Lista de Presentes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Quero/ })).not.toBeInTheDocument();
  });

  it('mostra o label da Gravata (preset) quando modo_arrecadacao é gravata', () => {
    const config = { ...baseConfig, modo_arrecadacao: 'gravata' as const, gravata_label: 'quero_presentear' as const };
    render(<LiveInviteView {...baseProps} config={config} />);

    const link = screen.getByRole('link', { name: 'Quero presentear' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/inv/ana-e-carlos/gravata');
    expect(screen.queryByRole('link', { name: 'Lista de Presentes' })).not.toBeInTheDocument();
  });

  it('não mostra nenhum botão de arrecadação quando modo_arrecadacao é nenhum', () => {
    const config = { ...baseConfig, modo_arrecadacao: 'nenhum' as const };
    render(<LiveInviteView {...baseProps} config={config} />);

    expect(screen.queryByRole('link', { name: 'Lista de Presentes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Quero/ })).not.toBeInTheDocument();
  });
});
