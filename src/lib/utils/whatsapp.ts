/** Usado quando o evento não tem um template de mensagem configurado nas Configurações. */
export const DEFAULT_WHATSAPP_TEMPLATE =
  'Você foi convidado(a) para o nosso casamento! 💍 Confirme sua presença por aqui: {link}';

/**
 * Substitui as variáveis {nome} e {link} num template de mensagem, sem
 * gerar nenhum link — usado tanto pelo `generateWhatsappLink` (link wa.me)
 * quanto por telas que precisam só do texto puro, ex: copiar a mensagem
 * completa para a área de transferência em vez de copiar só o link.
 */
export function renderWhatsappTemplate(template: string, vars: { nome: string; link: string }): string {
  return template.replace(/{nome}/g, vars.nome).replace(/{link}/g, vars.link);
}

/**
 * Gera um link direto para o WhatsApp (wa.me)
 * @param telefone Telefone do destinatário
 * @param template Template da mensagem com variáveis {nome} e {link}
 * @param vars Objeto com os valores das variáveis
 */
export function generateWhatsappLink(
  telefone: string,
  template: string,
  vars: { nome: string; link: string }
): string {
  // 1. Limpar telefone
  const cleanPhone = telefone.replace(/\D/g, '');
  let finalPhone = cleanPhone;

  if (cleanPhone) {
    // Se não tem código do país, assume Brasil (55)
    if (cleanPhone.length <= 11) {
      finalPhone = `55${cleanPhone}`;
    }
  }

  // 2. Processar template
  const message = renderWhatsappTemplate(template, vars);

  // 3. Gerar URL
  const baseUrl = finalPhone ? `https://wa.me/${finalPhone}` : `https://wa.me/`;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}
