import { OpenAI } from 'openai';
import { supabase } from '../supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'NO_KEY',
});

/**
 * Central Orchestrator for hybrid AI bot and automated issue routing.
 */
export const AISupportService = {

  /**
   * Fetches active master-controlled prompt from public.ai_config
   */
  async getSystemPrompt(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_config')
        .select('system_prompt')
        .eq('key', 'master_prompt')
        .single();
      
      if (error || !data) {
        return 'Você é o Assistente Oficial do InviteEvent. Regras: Cordial e objetivo.';
      }
      return data.system_prompt;
    } catch (e) {
      return 'Você é o Assistente Oficial do InviteEvent. Regras: Cordial.';
    }
  },

  /**
   * Main Ingestion Fork: Processes user messages and acts (reply or report bug)
   */
  async processMessage(ticketId: string, userMessage: string) {
    try {
      // 1. Guard: Verify if bot is actually enabled for this ticket
      const { data: ticket } = await supabase
        .from('suporte_tickets')
        .select('bot_active, evento_id')
        .eq('id', ticketId)
        .single();

      if (!ticket || !ticket.bot_active) {
        return { active: false, response: 'Bot Inativo' };
      }

      const systemPrompt = await this.getSystemPrompt();

      // 2. Check if Key exists. If not, fallback to a resilient local simulation for environment testing.
      if (!process.env.OPENAI_API_KEY) {
        return this.runSimulation(ticketId, userMessage);
      }

      // 3. Real OpenAI Workflow with Function Calling (Issue Tracker trigger)
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Or gpt-4o depending on subscription
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_technical_issue',
            description: 'Acione esta função IMEDIATAMENTE se o usuário reportar bugs, erros no sistema (ex: erro 404, falha no PIX, login expirou) ou situações não cobertas na base.',
            parameters: {
              type: 'object',
              properties: {
                titulo: { type: 'string', description: 'Resumo curto do problema técnico' },
                descricao: { type: 'string', description: 'Detalhes do erro reportado pelo usuário' }
              },
              required: ['titulo', 'descricao']
            }
          }
        }],
        tool_choice: 'auto'
      });

      const msg = response.choices[0].message;

      // CASE A: AI decided to trigger an ISSUE
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const call = msg.tool_calls[0];
        const args = JSON.parse(call.function.arguments);
        
        await this.triggerIssueAndLockBot(ticketId, args.titulo, args.descricao);

        // Standard response confirming human takeover
        return { 
          active: true, 
          is_issue: true,
          response: 'Detectei um problema técnico inesperado e acionei nossa equipe técnica agora mesmo. Um de nossos especialistas cuidará do seu caso a partir de agora.' 
        };
      }

      // CASE B: Normal dynamic reply
      const content = msg.content || 'Entendido. Em que posso ajudar?';
      return { active: true, response: content };

    } catch (error) {
      console.error('[AI Service Error]', error);
      return { active: false, error: 'Failure during AI orchestration' };
    }
  },

  /**
   * Finalizing locks: creates the row in `issues`, stops `bot_active` and flags `needs_human_attention`.
   */
  async triggerIssueAndLockBot(ticketId: string, titulo: string, descricao: string) {
    // 1. Create the Issue
    await supabase
      .from('issues')
      .insert([{
        ticket_id: ticketId,
        titulo: titulo,
        descricao: descricao,
        status: 'aberta'
      }]);

    // 2. Flip workflow control switch
    await supabase
      .from('suporte_tickets')
      .update({
        bot_active: false,
        needs_human_attention: true
      })
      .eq('id', ticketId);
  },

  /**
   * Ultra-Resilient local simulator used when OPENAI_API_KEY is missing.
   * Analyzes keywords automatically to allow FULL E2E functionality without remote key.
   */
  async runSimulation(ticketId: string, msg: string) {
    const triggerPhrases = ['erro', 'falha', 'nao funciona', 'nao entra', 'bug', '404', 'quebrado'];
    const hasFailure = triggerPhrases.some(p => msg.toLowerCase().includes(p));

    if (hasFailure) {
      await this.triggerIssueAndLockBot(ticketId, 'Falha reportada via Simulador', msg);
      return {
        active: true,
        is_issue: true,
        simulated: true,
        response: '[SIMULATOR] Sinto muito! Detectamos a falha reportada e acionamos a equipe técnica com prioridade absoluta.'
      };
    }

    return {
      active: true,
      simulated: true,
      response: `[SIMULATOR] Recebi sua mensagem: "${msg}". Em que posso auxiliar?`
    };
  }
};
