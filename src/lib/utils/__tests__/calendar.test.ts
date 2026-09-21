import { buildGoogleCalendarUrl, buildIcsContent, openAddToCalendar, CalendarEventInput } from '../calendar';

/**
 * Pedido do usuário em 21/09/2026: "adicionar funcionalidade de
 * adicionar a agenda que funcione no android, IOS e windows no
 * momento de confirmar presença". Ver AddToCalendarButton.tsx.
 */

const baseEvent: CalendarEventInput = {
  title: 'Casamento de Ana & Carlos',
  description: 'Confirme sua presença e venha celebrar com a gente!',
  location: 'Rua das Flores, 123',
  date: '2026-11-14',
  time: '16:30',
};

describe('buildGoogleCalendarUrl', () => {
  it('monta a URL do Google Calendar com título, datas, local e descrição', () => {
    const url = buildGoogleCalendarUrl(baseEvent);
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsed.searchParams.get('text')).toBe('Casamento de Ana & Carlos');
    expect(parsed.searchParams.get('location')).toBe('Rua das Flores, 123');
    expect(parsed.searchParams.get('details')).toBe('Confirme sua presença e venha celebrar com a gente!');
    // Hora flutuante (sem Z/UTC): início às 16:30 do dia informado, término 5h depois (21:30).
    expect(parsed.searchParams.get('dates')).toBe('20261114T163000/20261114T213000');
  });

  it('usa 16:00 como horário padrão quando não informado', () => {
    const url = buildGoogleCalendarUrl({ title: 'Evento', date: '2026-01-05' });
    const dates = new URL(url).searchParams.get('dates');
    expect(dates).toBe('20260105T160000/20260105T210000');
  });

  it('não inclui location/details quando não informados', () => {
    const url = buildGoogleCalendarUrl({ title: 'Evento', date: '2026-01-05' });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('location')).toBe(false);
    expect(parsed.searchParams.has('details')).toBe(false);
  });
});

describe('buildIcsContent', () => {
  it('gera um .ics válido (RFC 5545) com SUMMARY, DTSTART, DTEND e LOCATION', () => {
    const ics = buildIcsContent(baseEvent);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Casamento de Ana & Carlos');
    expect(ics).toContain('DTSTART:20261114T163000');
    expect(ics).toContain('DTEND:20261114T213000');
    expect(ics).toContain('LOCATION:Rua das Flores\\, 123');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('escapa vírgulas no LOCATION/DESCRIPTION conforme o padrão ICS', () => {
    const ics = buildIcsContent({ ...baseEvent, location: 'Av. Principal, 100, Centro' });
    expect(ics).toContain('LOCATION:Av. Principal\\, 100\\, Centro');
  });

  it('usa quebras de linha CRLF, exigidas pelo RFC 5545', () => {
    const ics = buildIcsContent(baseEvent);
    expect(ics).toContain('\r\n');
  });
});

describe('openAddToCalendar', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
    jest.restoreAllMocks();
  });

  it('no Android, abre o Google Calendar em nova aba (sem download)', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      configurable: true,
    });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    openAddToCalendar(baseEvent);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://calendar.google.com/calendar/render'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('no iOS, baixa um arquivo .ics (não abre o Google Calendar)', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = jest.fn();
    (global.URL as any).createObjectURL = createObjectURL;
    (global.URL as any).revokeObjectURL = revokeObjectURL;
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    openAddToCalendar(baseEvent);

    expect(openSpy).not.toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('no Windows/desktop, também baixa um arquivo .ics', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      configurable: true,
    });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    (global.URL as any).createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    (global.URL as any).revokeObjectURL = jest.fn();
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    openAddToCalendar(baseEvent);

    expect(openSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
