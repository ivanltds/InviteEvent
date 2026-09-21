import { GravataLabel } from '@/lib/types/database';

/**
 * Textos do botão da Gravata dos Noivos. Dois presets fechados +
 * 'personalizado' (texto livre, com limite de caracteres — pedido do
 * usuário em 21/09/2026: "deve ser configuravel com as opçõs, mas tbm
 * ter uma caixa de texto com tamanho limitado"). Mantido num único
 * lugar para o painel admin e o convite público sempre mostrarem
 * exatamente o mesmo texto, evitando o tipo de divergência achado em
 * `fonts.ts` (FUN-15 da auditoria de 20/09/2026, dois catálogos de
 * fontes que não batiam entre si).
 */
export const GRAVATA_LABEL_TEXT: Record<GravataLabel, string> = {
  quero_presentear: 'Quero presentear',
  quero_colaborar: 'Quero colaborar',
  // Fallback exibido só se o texto personalizado ainda não foi digitado.
  personalizado: 'Quero colaborar',
};

export const GRAVATA_LABEL_OPTIONS: GravataLabel[] = ['quero_presentear', 'quero_colaborar', 'personalizado'];

/** Rótulo de cada opção no seletor do admin (diferente de GRAVATA_LABEL_TEXT, que é o texto exibido no convite). */
export const GRAVATA_LABEL_OPTION_NAMES: Record<GravataLabel, string> = {
  quero_presentear: 'Quero presentear',
  quero_colaborar: 'Quero colaborar',
  personalizado: 'Personalizado',
};

/** Limite de caracteres do texto personalizado — o botão tem espaço limitado, textos longos quebram o layout. */
export const GRAVATA_LABEL_PERSONALIZADO_MAX_LENGTH = 30;

/**
 * Resolve o texto final do botão: preset fixo, ou o texto personalizado
 * (com fallback pro preset padrão se ainda estiver vazio). Usado tanto
 * no convite público (LiveInviteView, RSVP) quanto em qualquer prévia
 * admin, pra nunca duplicar essa regra.
 */
export function resolveGravataLabel(label?: GravataLabel | null, personalizado?: string | null): string {
  if (label === 'personalizado') {
    const texto = personalizado?.trim();
    return texto || GRAVATA_LABEL_TEXT.personalizado;
  }
  return GRAVATA_LABEL_TEXT[label ?? 'quero_colaborar'];
}
