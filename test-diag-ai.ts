const dotenv = require('dotenv');
dotenv.config();

async function runTest() {
  const TICKET_ID = 'b786ba77-1481-480e-99db-2bedb04a2e4d';
  const REMETENTE_ID = '498042e7-b5f6-4b08-b409-7334fdff0b43'; // Aline
  console.log('=== DIAGNOSTICO FINAL END-TO-END ===');
  
  try {
    const { supabase } = await import('./src/lib/supabase');
    const { AISupportService } = await import('./src/lib/services/aiSupportService');

    console.log('[1] Consultando Perfil para isMaster...');
    const { data: perfil, error: errPerfil } = await supabase.from('perfis').select('is_master').eq('id', REMETENTE_ID).single();
    
    if (errPerfil) {
       console.error('[1.1] ERRO AO BUSCAR PERFIL:', errPerfil);
    }

    const isMaster = perfil?.is_master || false;
    console.log('[1.2] Valor de isMaster:', isMaster);

    if (!isMaster) {
      console.log('[2] Disparando Orquestrador AI...');
      const aiResult = await AISupportService.processMessage(TICKET_ID, 'TESTE E2E FINAL EM CADEIA');
      console.log('[2.1] Resposta AI gerada:', aiResult.response);

      if (aiResult && aiResult.active && aiResult.response) {
        console.log('[3] Tentando INSERT final no banco via Supabase Client...');
        const insertRes = await supabase
          .from('suporte_mensagens')
          .insert([{
            ticket_id: TICKET_ID,
            remetente_id: '00000000-0000-0000-0000-000000000000',
            conteudo: aiResult.response
          }]);
        
        console.log('[3.1] Resultado do Insert:', insertRes.error ? insertRes.error : 'SUCESSO COMPLETO!');
      }
    } else {
      console.log('[2] ABORTADO: isMaster é true!');
    }

  } catch (err) {
    console.error('[FATAL]', err);
  }
}

runTest();
