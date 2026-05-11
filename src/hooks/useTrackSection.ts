'use client';
/**
 * useTrackSection — Hook de Rastreamento de Visibilidade por Seção (PRD-008)
 *
 * Usa IntersectionObserver (API nativa, zero custo de CPU) para detectar
 * quando uma seção entra e sai da viewport, disparando telemetria de tempo.
 *
 * @param eventoId - UUID do evento atual
 * @param sectionName - Identificador da seção (ex: 'historia', 'agenda', 'rsvp')
 * @param threshold - % de visibilidade para iniciar o timer (default: 50%)
 */

import { useEffect, useRef } from 'react';
import { Telemetry } from '@/lib/services/telemetryService';

interface UseTrackSectionOptions {
  eventoId: string | null | undefined;
  sectionName: string;
  threshold?: number;
}

export function useTrackSection(
  ref: React.RefObject<HTMLElement>,
  { eventoId, sectionName, threshold = 0.5 }: UseTrackSectionOptions
): void {
  const stopTimerRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    // Não rastrear no SSR, sem evento ou no modo preview do admin
    if (
      !eventoId ||
      typeof window === 'undefined' ||
      window.location.search.includes('preview=true') ||
      window.location.search.includes('skip_gateway=true')
    ) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isActiveRef.current) {
            // Seção entrou na viewport → Inicia o cronômetro
            isActiveRef.current = true;
            stopTimerRef.current = Telemetry.startSectionTimer(eventoId, sectionName);
          } else if (!entry.isIntersecting && isActiveRef.current) {
            // Seção saiu da viewport → Para o cronômetro e envia o dado
            isActiveRef.current = false;
            if (stopTimerRef.current) {
              stopTimerRef.current();
              stopTimerRef.current = null;
            }
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      // Garantir que o timer seja finalizado ao desmontar o componente
      if (isActiveRef.current && stopTimerRef.current) {
        stopTimerRef.current();
      }
    };
  }, [eventoId, sectionName, threshold, ref]);
}
