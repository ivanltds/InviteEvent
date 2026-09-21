import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddToCalendarButton from '../AddToCalendarButton';
import * as calendarUtils from '@/lib/utils/calendar';

/**
 * Pedido do usuário em 21/09/2026: "adicionar funcionalidade de
 * adicionar a agenda ... um botão mais discreto abaixo do de
 * gravata/lista de presentes."
 */

jest.mock('@/lib/utils/calendar', () => ({
  ...jest.requireActual('@/lib/utils/calendar'),
  openAddToCalendar: jest.fn(),
}));

const baseConfig = {
  id: 1,
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  data_casamento: '2026-11-14',
  horario_cerimonia: '16:30',
  endereco_cerimonia: 'Rua das Flores, 123',
} as any;

describe('AddToCalendarButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o botão "Adicionar à agenda"', () => {
    render(<AddToCalendarButton config={baseConfig} />);
    expect(screen.getByRole('button', { name: /Adicionar à agenda/i })).toBeInTheDocument();
  });

  it('não renderiza nada sem data do casamento cadastrada', () => {
    const { container } = render(<AddToCalendarButton config={{ ...baseConfig, data_casamento: undefined }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada sem config nenhuma', () => {
    const { container } = render(<AddToCalendarButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ao clicar, chama openAddToCalendar com título, local, data e horário da cerimônia', () => {
    render(<AddToCalendarButton config={baseConfig} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar à agenda/i }));

    expect(calendarUtils.openAddToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Casamento de Ana & Carlos',
        location: 'Rua das Flores, 123',
        date: '2026-11-14',
        time: '16:30',
      })
    );
  });

  it('usa local_cerimonia como fallback quando não há endereco_cerimonia', () => {
    render(<AddToCalendarButton config={{ ...baseConfig, endereco_cerimonia: undefined, local_cerimonia: 'Igreja Matriz' }} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar à agenda/i }));

    expect(calendarUtils.openAddToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Igreja Matriz' })
    );
  });

  it('usa 16:00 como horário padrão quando horario_cerimonia não está cadastrado', () => {
    render(<AddToCalendarButton config={{ ...baseConfig, horario_cerimonia: undefined }} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar à agenda/i }));

    expect(calendarUtils.openAddToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ time: '16:00' })
    );
  });
});
