'use client';

import { Configuracao } from '@/lib/types/database';
import { openAddToCalendar, CalendarEventInput } from '@/lib/utils/calendar';
import styles from './AddToCalendarButton.module.css';

interface AddToCalendarButtonProps {
  config?: Configuracao;
}

/**
 * "Adicionar à agenda" — pedido do usuário em 21/09/2026: botão
 * discreto no momento de confirmar presença, abaixo do de gravata/
 * lista de presentes, que funcione em Android, iOS e Windows. Ver
 * lógica de plataforma em src/lib/utils/calendar.ts.
 */
export default function AddToCalendarButton({ config }: AddToCalendarButtonProps) {
  if (!config?.data_casamento) return null;

  const noiva = config.noiva_nome?.trim();
  const noivo = config.noivo_nome?.trim();
  const title = noiva && noivo ? `Casamento de ${noiva} & ${noivo}` : 'Casamento';

  // Mesmos fallbacks usados em Detalhes.tsx, pra sempre bater com o
  // que o convidado já viu na seção "Detalhes do Evento".
  const location = config.endereco_cerimonia || config.local_cerimonia || undefined;

  const event: CalendarEventInput = {
    title,
    description: 'Confirme sua presença e venha celebrar com a gente!',
    location,
    date: config.data_casamento,
    time: config.horario_cerimonia || '16:00',
  };

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => openAddToCalendar(event)}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      Adicionar à agenda
    </button>
  );
}
