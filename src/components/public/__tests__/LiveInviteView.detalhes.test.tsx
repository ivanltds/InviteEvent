import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveInviteView from '../LiveInviteView';
import { Configuracao } from '@/lib/types/database';

/**
 * Correção de 20/09/2026: <Detalhes> (seção "A Cerimônia"/"A Recepção",
 * com o endereço configurado pelos noivos) estava importado em
 * LiveInviteView mas nunca era renderizado — os convidados nunca viam o
 * endereço, mesmo com o campo preenchido em Configurações. Este teste
 * roda SEM mockar <Detalhes>, de propósito, pra pegar essa classe de
 * regressão (import morto) se ela voltar a acontecer.
 */
jest.mock('@/components/sections/Historia', () => () => <div />);
jest.mock('@/components/sections/OsNoivos', () => () => <div />);
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
  local_cerimonia: 'Igreja São José',
  endereco_cerimonia: 'Av. Paulista, 1000, São Paulo',
};

const baseProps = {
  couple: { noiva: 'Ana', noivo: 'Carlos', data: '13/06/2026', rawDate: '2026-06-13' },
  visibility: { historia: true, noivos: true, faq: true, presentes: true },
  agenda: [],
  slug: 'ana-e-carlos',
};

describe('LiveInviteView — seção de detalhes/endereço da cerimônia', () => {
  it('renderiza o local e o endereço configurados pelos noivos', () => {
    render(<LiveInviteView {...baseProps} config={baseConfig} />);

    expect(screen.getByText('O Evento')).toBeInTheDocument();
    expect(screen.getByText('Igreja São José')).toBeInTheDocument();
    expect(screen.getByText('Av. Paulista, 1000, São Paulo')).toBeInTheDocument();
  });

  it('oferece o link de navegação (Google Maps) para o endereço configurado', () => {
    render(<LiveInviteView {...baseProps} config={baseConfig} />);

    const link = screen.getByText('Google Maps').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
  });
});
