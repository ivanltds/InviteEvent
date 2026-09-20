import { GravataLabel } from '@/lib/types/database';

/**
 * Textos do botão da Gravata dos Noivos. Preset fechado de propósito (não
 * é texto livre) — mantido num único lugar para o painel admin e o
 * convite público sempre mostrarem exatamente o mesmo texto, evitando o
 * tipo de divergência achado em `fonts.ts` (FUN-15 da auditoria de
 * 20/09/2026, dois catálogos de fontes que não batiam entre si).
 */
export const GRAVATA_LABEL_TEXT: Record<GravataLabel, string> = {
  quero_presentear: 'Quero presentear',
  quero_colaborar: 'Quero colaborar',
};

export const GRAVATA_LABEL_OPTIONS: GravataLabel[] = ['quero_presentear', 'quero_colaborar'];
