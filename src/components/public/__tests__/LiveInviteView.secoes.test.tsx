import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveInviteView from '../LiveInviteView';
import { Configuracao } from '@/lib/types/database';

/**
 * Pedido do usuário em 20/09/2026: (1) o Mural de Lembranças deve ser
 * opcional (removível nas configurações), e (2) a ordem das seções do
 * convite deve ser reordenável nas configurações.
 */
jest.mock('@/components/sections/Historia', () => () => <div data-testid="sec-historia" />);
jest.mock('@/components/sections/OsNoivos', () => () => <div data-testid="sec-noivos" />);
jest.mock('@/components/sections/Detalhes', () => () => <div />);
jest.mock('@/components/sections/FAQ', () => () => <div data-testid="sec-faq" />);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="sec-rsvp" />);
jest.mock('@/components/sections/AgendaSection', () => () => <div data-testid="sec-agenda" />);
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
  visibility: { historia: true, noivos: true, faq: true, presentes: true },
  agenda: [],
  slug: 'ana-e-carlos',
};

describe('LiveInviteView — mural opcional e ordem das seções', () => {
  it('mostra o botão do Mural por padrão', () => {
    render(<LiveInviteView {...baseProps} config={baseConfig} />);
    expect(screen.getByRole('link', { name: 'Mural de Lembranças' })).toBeInTheDocument();
  });

  it('esconde o botão do Mural quando mostrar_mural é false', () => {
    const config = { ...baseConfig, mostrar_mural: false };
    render(<LiveInviteView {...baseProps} config={config} />);
    expect(screen.queryByRole('link', { name: 'Mural de Lembranças' })).not.toBeInTheDocument();
  });

  it('renderiza as seções na ordem padrão quando secoes_ordem não está definido', () => {
    render(<LiveInviteView {...baseProps} config={baseConfig} />);
    const testIds = screen.getAllByTestId(/^sec-/).map((el) => el.getAttribute('data-testid'));
    expect(testIds).toEqual(['sec-historia', 'sec-noivos', 'sec-agenda', 'sec-rsvp', 'sec-faq']);
  });

  it('renderiza as seções na ordem customizada salva em secoes_ordem', () => {
    const config = { ...baseConfig, secoes_ordem: ['faq', 'agenda', 'rsvp', 'historia', 'noivos'] };
    render(<LiveInviteView {...baseProps} config={config} />);
    const testIds = screen.getAllByTestId(/^sec-/).map((el) => el.getAttribute('data-testid'));
    expect(testIds).toEqual(['sec-faq', 'sec-agenda', 'sec-rsvp', 'sec-historia', 'sec-noivos']);
  });

  it('mantém agenda e rsvp mesmo quando historia/noivos/faq estão desativados', () => {
    const config = { ...baseConfig, secoes_ordem: ['rsvp', 'agenda'] };
    render(<LiveInviteView {...baseProps} config={config} visibility={{ historia: false, noivos: false, faq: false, presentes: true }} />);
    const testIds = screen.getAllByTestId(/^sec-/).map((el) => el.getAttribute('data-testid'));
    expect(testIds).toEqual(['sec-rsvp', 'sec-agenda']);
  });
});
