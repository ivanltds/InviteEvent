import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase';

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
      console.log('[AI ENGINE DEBUG] Executando ProcessMessage V2.0 (GPT-4o-Mini + Tools API)');
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

      // 2. Memória Conversacional: Busca os ÚLTIMOS 15 registros de histórico
      const { data: history } = await supabase
        .from('suporte_mensagens')
        .select('remetente_id, conteudo')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false }) // Busca do mais novo para o mais velho
        .limit(15);

      // Mapeia e inverte para restaurar a ordem cronológica
      let chatHistory = (history || []).map((msg: any) => ({
        role: msg.remetente_id === '00000000-0000-0000-0000-000000000000' ? 'assistant' as const : 'user' as const,
        content: msg.conteudo
      })).reverse();

      // Remove a última mensagem do histórico se ela for IDÊNTICA à mensagem que acabamos de receber
      // (para não enviar duplicado para a OpenAI, já que a API salva no banco antes de nos chamar)
      if (chatHistory.length > 0 && 
          chatHistory[chatHistory.length - 1].content === userMessage &&
          chatHistory[chatHistory.length - 1].role === 'user') {
        chatHistory.pop(); 
      }

      // 3. Check if Key exists.
      if (!process.env.OPENAI_API_KEY) {
        return this.runSimulation(ticketId, userMessage);
      }

      // 4. Real OpenAI Workflow
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Modelo muito mais inteligente em seguir funções, e custa o mesmo/menos que 3.5
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userMessage }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'create_issue',
                description: 'OBRIGATÓRIO: Chame isto IMEDIATAMENTE se o usuário relatar um BUG, erro 404, falha de upload persistente, ou comportamento quebrado. Isso gera um chamado no Kanban e desativa o bot.',
                parameters: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Título curto do problema (ex: Erro no Upload)' },
                    description: { type: 'string', description: 'Detalhes extra do bug detectado' },
                  },
                  required: ['title', 'description'],
                }
              }
            }
          ],
          tool_choice: 'auto',
        });

        const assistantMsg = response.choices[0].message;

        // 🔥 NOVO PADRÃO: Caso a IA chame o Tool Call
        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
          const toolCall = assistantMsg.tool_calls[0] as any;
          if (toolCall.function.name === 'create_issue') {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            await this.triggerIssueAndLockBot(ticketId, args.title, args.description);
            return { 
              active: true, 
              response: "🚨 SISTEMA: BUG IDENTIFICADO. ✅ Um chamado técnico interno foi gerado e colocado no Board Kanban para correção imediata. Um especialista assumirá este atendimento em instantes."
            };
          }
        }

        return { active: true, response: assistantMsg.content || "Olá! Como posso ajudar?" };
      } catch (apiErr) {
        console.error('[AI API Fail - Falling back to simulator]', apiErr);
        // Se a API da OpenAI falhar (Ex: Key inválida 401), usamos o simulador como backup para não quebrar o fluxo do app
        return this.runSimulation(ticketId, userMessage);
      }

    } catch (error) {
      console.error('[AI Service Error]', error);
      return { active: false, error: 'Failure during AI orchestration' };
    }
  },

  /**
   * Finalizing locks: creates the row in `issues`, stops `bot_active` and flags `needs_human_attention`.
   */
  async triggerIssueAndLockBot(ticketId: string, titulo: string, descricao: string) {
    console.log('[AI ENGINE] Analisando deduplicação semântica para ticket:', ticketId);
    let targetIssueId: string | null = null;

    try {
      // 1. Buscar TODAS as issues ativas (não corrigidas)
      const { data: activeIssues } = await supabase
        .from('issues')
        .select('id, titulo, descricao')
        .neq('status', 'corrigida');

      if (activeIssues && activeIssues.length > 0) {
        console.log(`[AI ENGINE] ${activeIssues.length} Issues ativas encontradas. Consultando Cérebro para Matching...`);
        
        const issueListString = activeIssues
          .map((iss: any) => `[ID: ${iss.id}] Título: ${iss.titulo} | Descrição: ${iss.descricao}`)
          .join('\n\n');

        const matchResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um classificador de bugs de alta precisão. Sua missão é evitar duplicatas no quadro Kanban.' },
            { role: 'user', content: `Analise o NOVO PROBLEMA abaixo e compare com a LISTA DE PROBLEMAS ATIVOS.
            Se for o MESMO bug (mesmo que descrito com outras palavras), responda APENAS com o UUID do problema correspondente.
            Se for um problema COMPLETAMENTE NOVO ou diferente dos listados, responda APENAS com a palavra "NOVO".
            
            NOVO PROBLEMA:
            Título: ${titulo}
            Descrição: ${descricao}
            
            LISTA DE PROBLEMAS ATIVOS:
            ${issueListString}
            
            Sua Resposta (ID ou NOVO):` }
          ],
          temperature: 0,
          max_tokens: 50,
        });

        const decision = matchResponse.choices[0]?.message?.content?.trim() || 'NOVO';
        console.log('[AI ENGINE] Decisão do Classificador:', decision);

        // Verificar se a resposta é um UUID válido presente na nossa lista
        const matchedIssue = activeIssues.find((iss: any) => decision.includes(iss.id));
        if (matchedIssue) {
          console.log('[AI ENGINE] Smart Match IDENTIFICADO! Mesclando com:', matchedIssue.id);
          targetIssueId = matchedIssue.id;
        }
      }
    } catch (errorMatch) {
      console.error('[AI ENGINE] Falha na análise semântica de duplicatas, caindo para criação direta.', errorMatch);
    }

    // 2. Se não achou correspondência semântica, cria um novo
    if (!targetIssueId) {
      console.log('[AI ENGINE] Nenhuma duplicata encontrada. Criando NOVA Issue...');
      const { data: newIssue, error: issueError } = await supabase
        .from('issues')
        .insert([{
          titulo: titulo,
          descricao: descricao,
          status: 'aberta'
        }])
        .select()
        .single();

      if (issueError) {
        console.error('[AI ENGINE ERROR] Falha ao criar issue no banco:', issueError);
        throw new Error(`Erro de Banco ao criar Issue: ${issueError.message}`);
      }
      targetIssueId = newIssue.id;
    }

    // 3. Vincular o ticket à Issue encontrada/criada
    const { error: updateError } = await supabase
      .from('suporte_tickets')
      .update({
        bot_active: false,
        needs_human_attention: true,
        issue_id: targetIssueId
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('[AI ENGINE ERROR] Falha ao atualizar status do ticket:', updateError);
      throw new Error(`Erro de Banco ao atualizar ticket: ${updateError.message}`);
    }
    console.log('[AI ENGINE] Operação concluída com sucesso! Vínculo estabelecido via SmartEngine.');
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
