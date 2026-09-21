/**
 * "Adicionar à agenda" — pedido do usuário em 21/09/2026: um botão
 * discreto no RSVP, abaixo do de gravata/lista de presentes, que
 * funcione em Android, iOS e Windows.
 *
 * Estratégia: gera tanto uma URL do Google Calendar (o app de agenda
 * padrão na maioria dos Androids — abre direto no navegador/app, sem
 * download) quanto o conteúdo de um arquivo .ics (padrão universal
 * reconhecido pelo Calendário do iOS/macOS e pelo Outlook/Calendário
 * do Windows — ao baixar, o próprio sistema abre o app de agenda
 * pronto pra adicionar o evento). `openAddToCalendar()` escolhe a via
 * certa por dispositivo.
 *
 * Datas em "hora flutuante" (sem sufixo Z/UTC nem TZID): a maioria dos
 * apps de agenda interpreta isso como o fuso horário local do próprio
 * aparelho — correto aqui porque convidados de um casamento estão,
 * majoritariamente, no mesmo fuso do evento.
 */

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  /** Data no formato YYYY-MM-DD. */
  date: string;
  /** Horário no formato HH:MM (24h). Default: 16:00. */
  time?: string;
  /** Duração em horas do evento. Default: 5. */
  durationHours?: number;
}

interface ParsedDates {
  start: Date;
  end: Date;
}

function parseEventDates(event: CalendarEventInput): ParsedDates {
  const [year, month, day] = event.date.split('-').map(Number);
  const [hour, minute] = (event.time || '16:00').split(':').map(Number);
  const start = new Date(year, (month || 1) - 1, day || 1, hour || 16, minute || 0);
  const end = new Date(start.getTime() + (event.durationHours ?? 5) * 60 * 60 * 1000);
  return { start, end };
}

/** Formata pro padrão de hora flutuante do ICS/Google Calendar: YYYYMMDDTHHMMSS. */
function formatFloating(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Escapa texto pro formato ICS (RFC 5545): vírgula, ponto-e-vírgula, barra invertida e quebras de linha. */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const { start, end } = parseEventDates(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatFloating(start)}/${formatFloating(end)}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: CalendarEventInput): string {
  const { start, end } = parseEventDates(event);
  const now = formatFloating(new Date());
  const uid = `${now}-${Math.random().toString(36).slice(2, 10)}@invite-event`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InviteEventAI//Convite de Casamento//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatFloating(start)}`,
    `DTEND:${formatFloating(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  // CRLF é o quebra-linha exigido pelo RFC 5545.
  return lines.join('\r\n');
}

function downloadIcsFile(event: CalendarEventInput, filename: string) {
  const blob = new Blob([buildIcsContent(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Abre o fluxo certo de "adicionar à agenda" pro dispositivo do
 * convidado: Android → Google Calendar (web/app, sem download); iOS e
 * Windows/desktop → baixa o .ics, que o próprio sistema abre no app de
 * agenda padrão (Calendário do iPhone, Outlook/Calendário do Windows).
 */
export function openAddToCalendar(event: CalendarEventInput) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    window.open(buildGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
    return;
  }

  const filename = `${event.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'evento'}.ics`;
  downloadIcsFile(event, filename);
}
