import { OpenAI } from 'openai';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'NO_KEY',
});

/**
 * Persona consultiva de vendas/orientação — NÃO é o mesmo assistente de
 * suporte pós-login (aiSupportService.ts). Este atende visitante anônimo
 * na Landing Page, antes do cadastro. Copy revisada em 22/09/2026; ajustar
 * o texto livremente conforme feedback real de conversas — o que importa
 * manter é: não citar valores em R$ (não há preço comunicado na LP hoje) e
 * sempre oferecer /criar como próximo passo natural.
 */
const SYSTEM_PROMPT = `Você é a assistente consultiva da Celebraê, uma plataforma de convites de casamento digitais. Fala em português do Brasil, tom caloroso e direto, sem emojis em excesso.

O que a Celebraê oferece (não invente outras features):
- Convite digital com envelope/animação de abertura, temas visuais e 7 modelos de cartão de compartilhamento.
- RSVP (confirmação de presença) automático e nominal, com gestão de acompanhantes.
- Lista de presentes com resgate via PIX.
- Mural de fotos e mensagens dos convidados, em tempo real.
- Agenda do evento (cerimônia, recepção) com botão de "Adicionar à Agenda" no celular do convidado.
- Painel administrativo completo pra quem organiza o evento.

Seu objetivo: entender o que a pessoa procura (tipo de evento, prazo, se já tem convite pronto) e mostrar como a Celebraê ajuda, sem forçar.

Regras importantes:
- NUNCA cite valores em reais (R$) ou "preço" — não há tabela de preço divulgada. Se perguntarem sobre custo, diga que a ativação é simples e feita direto no painel após o cadastro, sem compromisso, e direcione pra criar o convite pra ver na prática.
- Só peça e-mail ou WhatsApp quando a conversa chegar num ponto natural (ex: a pessoa demonstrou interesse real, perguntou "como começo?" ou pediu mais informações). Pergunte antes de pedir ("posso te mandar mais detalhes por e-mail ou WhatsApp?") e só use a ferramenta capturar_contato depois que a pessoa fornecer o dado espontaneamente.
- Sempre que fizer sentido, incentive a pessoa a clicar em "Criar Convite Agora" — é grátis começar e ver o resultado.
- Seja breve: respostas de 2-4 frases, não parágrafos longos.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

export const LandingChatService = {
  async getOrCreateLead(sessionId: string, utm?: UtmParams) {
    const supabase = await getSupabaseServerClient();

    const { data: existing } = await supabase
      .from('landing_leads')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) return existing;

    const { data: created, error } = await supabase
      .from('landing_leads')
      .insert([{
        session_id: sessionId,
        utm_source: utm?.source || null,
        utm_medium: utm?.medium || null,
        utm_campaign: utm?.campaign || null,
      }])
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar lead: ${error.message}`);
    return created;
  },

  /** Últimas `limit` mensagens em ordem cronológica, ANTES da mensagem atual do usuário (essa é adicionada separadamente na chamada à OpenAI). */
  async getHistory(leadId: string, limit = 10): Promise<ChatMessage[]> {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from('landing_chat_mensagens')
      .select('role, conteudo')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || [])
      .map((m: { role: string; conteudo: string }) => ({ role: m.role as 'user' | 'assistant', content: m.conteudo }))
      .reverse();
  },

  async saveMessage(leadId: string, role: 'user' | 'assistant', conteudo: string) {
    const supabase = await getSupabaseServerClient();
    await supabase.from('landing_chat_mensagens').insert([{ lead_id: leadId, role, conteudo }]);
  },

  async captureContact(sessionId: string, email?: string, whatsapp?: string) {
    const updates: Record<string, string> = {};
    if (email) updates.email = email;
    if (whatsapp) updates.whatsapp = whatsapp;
    if (Object.keys(updates).length === 0) return;

    const supabase = await getSupabaseServerClient();
    await supabase.from('landing_leads').update(updates).eq('session_id', sessionId);
  },

  /** Resposta local sem IA (sem custo, sem latência de rede) usada quando OPENAI_API_KEY não está configurada — mantém o widget funcional em dev. */
  runSimulation(userMessage: string): string {
    return `[SIMULADOR] Recebi sua mensagem: "${userMessage}". A Celebraê cria convites de casamento digitais com RSVP automático, lista de presentes via PIX, mural de fotos em tempo real e muito mais. Quer ver na prática? Clique em "Criar Convite Agora" — é grátis começar!`;
  },

  async processMessage(sessionId: string, userMessage: string, utm?: UtmParams): Promise<{ response: string; leadId: string }> {
    const lead = await this.getOrCreateLead(sessionId, utm);

    // Histórico buscado ANTES de salvar a mensagem atual, pra não precisar
    // de um truque de deduplicação depois (diferente de aiSupportService).
    const history = await this.getHistory(lead.id, 10);
    await this.saveMessage(lead.id, 'user', userMessage);

    if (!process.env.OPENAI_API_KEY) {
      const simulated = this.runSimulation(userMessage);
      await this.saveMessage(lead.id, 'assistant', simulated);
      return { response: simulated, leadId: lead.id };
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: userMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'capturar_contato',
              description: 'Chame quando o visitante fornecer e-mail e/ou WhatsApp espontaneamente, OU logo após você perguntar se pode mandar mais informações e ele topar e informar o contato. NUNCA chame sem o visitante ter fornecido o dado, e nunca exija o contato antes de responder a dúvida dele.',
              parameters: {
                type: 'object',
                properties: {
                  email: { type: 'string', description: 'E-mail informado pelo visitante, se houver' },
                  whatsapp: { type: 'string', description: 'Telefone/WhatsApp informado pelo visitante, se houver' },
                },
              },
            },
          },
        ],
        tool_choice: 'auto',
      });

      const assistantMsg = response.choices[0].message;

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        const toolCall = assistantMsg.tool_calls[0];
        if (toolCall.type === 'function' && toolCall.function.name === 'capturar_contato') {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          await this.captureContact(sessionId, args.email, args.whatsapp);
          const confirmation = 'Perfeito, já anotei aqui! 😊 Em breve alguém do nosso time pode te dar uma força. Enquanto isso, que tal já dar uma olhada em como fica o seu convite? É só clicar em "Criar Convite Agora".';
          await this.saveMessage(lead.id, 'assistant', confirmation);
          return { response: confirmation, leadId: lead.id };
        }
      }

      const replyText = assistantMsg.content || 'Oi! Como posso ajudar a planejar o convite digital de vocês?';
      await this.saveMessage(lead.id, 'assistant', replyText);
      return { response: replyText, leadId: lead.id };
    } catch (apiErr) {
      console.error('[LandingChatService] Falha na OpenAI, caindo pro simulador local:', apiErr);
      const simulated = this.runSimulation(userMessage);
      await this.saveMessage(lead.id, 'assistant', simulated);
      return { response: simulated, leadId: lead.id };
    }
  },
};
