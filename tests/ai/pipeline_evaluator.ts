import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env vars manually for standalone script execution
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The service to test - importing requires dynamic registration or using compiled logic.
// Since this is a pure logic eval, we will mock the core classification endpoint 
// to evaluate PROMPT BEHAVIOR on synthetic datasets.

type TestCase = {
  input: string;
  expectedIntent: 'SUPPORT_ESCALATION' | 'GENERAL_ANSWER';
  description: string;
};

const EVAL_DATASET: TestCase[] = [
  {
    input: "Olá, estou tentando fazer o RSVP mas dá erro 500 na tela quando clico em confirmar.",
    expectedIntent: 'SUPPORT_ESCALATION',
    description: "Detectar erro técnico explícito"
  },
  {
    input: "Qual é o horário da cerimônia e qual a chave PIX?",
    expectedIntent: 'GENERAL_ANSWER',
    description: "Responder informações gerais do evento"
  },
  {
    input: "Tem um bug no mural de fotos que não deixa eu subir minha imagem de jeito nenhum.",
    expectedIntent: 'SUPPORT_ESCALATION',
    description: "Relato de bug na interface de mídia"
  },
  {
    input: "Onde fica o local da festa?",
    expectedIntent: 'GENERAL_ANSWER',
    description: "Informação de localização"
  }
];

async function judgeAiResponse(input: string, responseContent: string): Promise<'SUPPORT_ESCALATION' | 'GENERAL_ANSWER'> {
  const judge = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você é um juiz de qualidade de IA. Analise a resposta dada pelo assistente de chat e determine se ele acionou um "Escalonamento de Suporte" (abriu chamado/travou chat) ou se apenas "Respondeu Normalmente". Responda APENAS "SUPPORT_ESCALATION" ou "GENERAL_ANSWER".' },
      { role: 'user', content: `Input do Usuário: "${input}"\nResposta do Assistente: "${responseContent}"` }
    ],
    temperature: 0,
  });

  const res = judge.choices[0]?.message?.content?.trim();
  if (res?.includes('SUPPORT_ESCALATION')) return 'SUPPORT_ESCALATION';
  return 'GENERAL_ANSWER';
}

async function runAiEvaluation() {
  console.log('🚀 INICIANDO ESTEIRA DE TESTES DE INTELIGÊNCIA (AI EVAL)...');
  console.log(`📊 Avaliando ${EVAL_DATASET.length} cenários de conversação...\n`);

  let passed = 0;
  let failed = 0;

  // Dynamically load the service by forcing current Node context
  // Wait! Since loading the full Next.js environment in standalone might break, we instead
  // run an isolation test querying the exact prompt payload used in AISupportService!
  const systemPrompt = "Você é o assistente do InviteEvent. Se o usuário relatar BUG ou ERRO, chame o gatilho de suporte interno. Senão, responda com cordialidade.";

  for (const scenario of EVAL_DATASET) {
    process.stdout.write(`➡️ Testando cenário: "${scenario.description}"... `);

    try {
      // Step 1: Invoke our actual target model using the exact architecture specs
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: scenario.input }
        ],
        temperature: 0,
      });

      const botReply = completion.choices[0]?.message?.content || '';
      
      // Fake-Trigger logic mimicking tool usage - wait, better to let the judge read the TEXT output!
      // In our system, an escalation outputs the text "🚨 SISTEMA: BUG IDENTIFICADO"
      // We simulate the logic call here or just evaluate intent directly.
      
      // Step 2: LLM-AS-A-JUDGE evaluating the outcome intent
      const detectedIntent = await judgeAiResponse(scenario.input, botReply);

      if (detectedIntent === scenario.expectedIntent) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        console.log(`   Input: "${scenario.input}"`);
        console.log(`   Esperado: ${scenario.expectedIntent} | Recebido: ${detectedIntent}`);
        console.log(`   Resposta gerada: "${botReply.substring(0, 100)}..."`);
        failed++;
      }
    } catch (err) {
      console.log('❌ ERROR: ' + (err as Error).message);
      failed++;
    }
  }

  console.log('\n=========================================');
  console.log('📊 RESUMO DA AVALIAÇÃO DE IA:');
  console.log(`✅ Aprovados: ${passed}`);
  console.log(`❌ Reprovados: ${failed}`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Esteira de IA validada com sucesso!');
    process.exit(0);
  }
}

runAiEvaluation().catch(console.error);
