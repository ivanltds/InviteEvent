import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgendaSection from '../AgendaSection';
import { buildGoogleMapsUrl, buildWazeUrl } from '@/lib/utils/maps';

/**
 * Pedido do usuário em 20/09/2026: todo endereço marcado na agenda deve
 * oferecer links de Google Maps e Waze para o convidado, mesmo quando os
 * noivos não preencheram os links manualmente no admin.
 */
describe('AgendaSection — links de navegação', () => {
  it('gera links de Google Maps e Waze a partir do endereço quando não há link manual', () => {
    render(
      <AgendaSection
        events={[
          {
            id: 'e1',
            evento_id: 'evt-1',
            titulo: 'Cerimônia',
            horario: '19:00:00',
            local_nome: 'Igreja São José',
            endereco: 'Av. Paulista, 1000, São Paulo',
          } as any,
        ]}
      />
    );

    expect(screen.getByText('Google Maps').closest('a')).toHaveAttribute(
      'href',
      buildGoogleMapsUrl('Av. Paulista, 1000, São Paulo')
    );
    expect(screen.getByText('Waze').closest('a')).toHaveAttribute(
      'href',
      buildWazeUrl('Av. Paulista, 1000, São Paulo')
    );
  });

  it('usa o link manual cadastrado quando existir, em vez do gerado', () => {
    render(
      <AgendaSection
        events={[
          {
            id: 'e1',
            evento_id: 'evt-1',
            titulo: 'Cerimônia',
            horario: '19:00:00',
            local_nome: 'Igreja São José',
            endereco: 'Av. Paulista, 1000',
            link_google_maps: 'https://maps.google.com/custom-link',
            link_waze: 'https://waze.com/custom-link',
          } as any,
        ]}
      />
    );

    expect(screen.getByText('Google Maps').closest('a')).toHaveAttribute('href', 'https://maps.google.com/custom-link');
    expect(screen.getByText('Waze').closest('a')).toHaveAttribute('href', 'https://waze.com/custom-link');
  });

  it('não mostra os botões quando o marco não tem endereço nem nome de local', () => {
    render(
      <AgendaSection
        events={[
          { id: 'e1', evento_id: 'evt-1', titulo: 'Cerimônia', horario: '19:00:00', local_nome: '', endereco: '' } as any,
        ]}
      />
    );

    expect(screen.queryByText('Google Maps')).not.toBeInTheDocument();
    expect(screen.queryByText('Waze')).not.toBeInTheDocument();
  });
});
