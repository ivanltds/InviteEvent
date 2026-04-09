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
  let message = template
    .replace(/{nome}/g, vars.nome)
    .replace(/{link}/g, vars.link);

  // 3. Gerar URL
  const baseUrl = finalPhone ? `https://wa.me/${finalPhone}` : `https://wa.me/`;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}
