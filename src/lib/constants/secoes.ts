/**
 * Ordem das seções do convite (docs internos: pedido do usuário em
 * 20/09/2026 — "a ordem das seções deve ser reordenaveis pelas
 * configurações"). Mural de Lembranças fica de fora daqui de propósito:
 * ele não é uma seção embutida na sequência do convite, é um botão/rota
 * à parte (ver `mostrar_mural` em Configuracao), então não faz sentido
 * "reordená-lo" junto com o resto.
 */
export type SecaoConvite = 'historia' | 'noivos' | 'agenda' | 'rsvp' | 'faq';

export const SECOES_CONVITE_ORDEM_PADRAO: SecaoConvite[] = ['historia', 'noivos', 'agenda', 'rsvp', 'faq'];

export const SECOES_CONVITE_LABELS: Record<SecaoConvite, string> = {
  historia: 'Nossa História',
  noivos: 'Os Noivos (Bio)',
  agenda: 'Programação',
  rsvp: 'Confirmação de Presença (RSVP)',
  faq: 'Perguntas Frequentes (FAQ)',
};

/**
 * Resolve a ordem final e válida das seções a partir do que está salvo em
 * `configuracoes.secoes_ordem`. Robusto a estados salvos incompletos ou
 * desatualizados: chaves inválidas são descartadas, e qualquer seção
 * ausente (ex.: configuração salva antes desta feature existir, ou uma
 * seção nova adicionada no futuro) entra no final, na ordem padrão — a
 * agenda e o RSVP nunca podem sumir do convite, então sempre aparecem
 * mesmo se ausentes do array salvo.
 */
export function resolveSecoesOrdem(secoesOrdem?: string[] | null): SecaoConvite[] {
  const validKeys = new Set<string>(SECOES_CONVITE_ORDEM_PADRAO);
  const provided = (secoesOrdem || []).filter(
    (key, index, arr): key is SecaoConvite => validKeys.has(key) && arr.indexOf(key) === index
  );
  const missing = SECOES_CONVITE_ORDEM_PADRAO.filter((key) => !provided.includes(key));
  return [...provided, ...missing];
}
