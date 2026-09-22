'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { configService } from '@/lib/services/configService';
import { supabase } from '@/lib/supabase';
import { computeSetupProgress, SetupProgress } from '@/lib/utils/setupProgress';
import styles from './SetupChecklist.module.css';

/** '#id' vira âncora em /admin/configuracoes; algo começando com '/' é um path completo (ex: '/admin/agenda'). */
function resolveChecklistHref(anchor: string): string {
  return anchor.startsWith('/') ? anchor : `/admin/configuracoes${anchor}`;
}

/**
 * Checklist de Setup Guiado (STORY-061).
 *
 * Substitui o banner estático + o OnboardingWizard (removidos) no
 * Dashboard. Progresso 100% derivado dos dados reais do evento — sem
 * nenhuma tabela nova de estado. Ver src/lib/utils/setupProgress.ts.
 *
 * Fica sempre visível enquanto o progresso < 100%. "Ocultar por enquanto"
 * é só estado local (não persiste) — reaparece no próximo load de
 * propósito, é um incentivo fraco, não um gate.
 */
export default function SetupChecklist({ eventId }: { eventId: string }) {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [config, agendaRes, faqRes, presentesRes] = await Promise.all([
        configService.getConfig(eventId),
        supabase.from('eventos_agenda').select('id', { count: 'exact', head: true }).eq('evento_id', eventId),
        supabase.from('faq').select('id', { count: 'exact', head: true }).eq('evento_id', eventId),
        supabase.from('presentes').select('id', { count: 'exact', head: true }).eq('evento_id', eventId),
      ]);

      if (cancelled) return;

      if (config) {
        setProgress(
          computeSetupProgress(config, {
            agenda: agendaRes.count || 0,
            faq: faqRes.count || 0,
            presentes: presentesRes.count || 0,
          })
        );
      }
      setLoading(false);
    }

    if (eventId) load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Nada a mostrar: ainda carregando, sem config, tudo concluído, ou
  // ocultado pelo próprio organizador nesta visita.
  if (loading || !progress || progress.percent === 100 || hidden) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Continue configurando o seu convite</h3>
          <p className={styles.subtitle}>
            {progress.completedCount} de {progress.totalCount} passos concluídos
          </p>
        </div>
        <button type="button" className={styles.hideBtn} onClick={() => setHidden(true)}>
          Ocultar por enquanto
        </button>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress.percent}%` }} />
      </div>

      <ul className={styles.itemList}>
        {progress.items.map(item => (
          <li key={item.key}>
            <Link href={resolveChecklistHref(item.anchor)} className={`${styles.itemLink} ${item.done ? styles.itemDone : ''}`}>
              <span className={styles.itemCheck} aria-hidden="true">
                {item.done ? '✓' : ''}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {progress.suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span className={styles.suggestionsLabel}>Ainda não experimentou?</span>
          <div className={styles.suggestionsList}>
            {progress.suggestions.map(s => (
              <Link key={s.key} href={resolveChecklistHref(s.anchor)} className={styles.suggestionChip}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
