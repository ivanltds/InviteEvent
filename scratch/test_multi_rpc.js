const { Client } = require('pg');
require('dotenv').config();

async function testRpc() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('--- Verificando RPC "reservar_multiplos_presentes_v1" ---');
  try {
    await client.connect();
    
    // 1. Pegar um evento e 2 presentes
    const { rows: event } = await client.query('SELECT id FROM eventos LIMIT 1');
    if (!event.length) return console.log('Nenhum evento para teste.');

    const { rows: gifts } = await client.query('SELECT id FROM presentes WHERE evento_id = $1 LIMIT 2', [event[0].id]);
    if (gifts.length < 2) return console.log('Crie pelo menos 2 presentes no admin antes de rodar este teste.');

    const giftIds = gifts.map(g => g.id);
    console.log(`Testando com os presentes: ${giftIds.join(', ')}`);

    // 2. Chamar RPC via SQL para teste rápido
    const { rows: rpcResult } = await client.query(
      'SELECT reservar_multiplos_presentes_v1($1, $2, $3, NULL, $4)',
      [giftIds, 'http://teste-multi.com/comp.jpg', 'Mensagem de teste unitário', 'Testador E2E']
    );

    console.log('Resultado RPC:', rpcResult[0].reservar_multiplos_presentes_v1);

    if (rpcResult[0].reservar_multiplos_presentes_v1.success) {
      console.log('✅ RPC MULTIPLE GIFT: FUNCIONANDO!');
      
      // 3. Verificar se gravou a mensagem no comprovante
      const { rows: comprobantes } = await client.query(
        'SELECT mensagem FROM comprovantes WHERE url_comprovante = $1 LIMIT 1',
        ['http://teste-multi.com/comp.jpg']
      );
      console.log('Mensagem gravada:', comprobantes[0]?.mensagem);
      
      if (comprobantes[0]?.mensagem === 'Mensagem de teste unitário') {
        console.log('✅ PERSISTÊNCIA DE MENSAGEM: FUNCIONANDO!');
      }

      // Cleanup
      await client.query('DELETE FROM comprovantes WHERE url_comprovante = $1', ['http://teste-multi.com/comp.jpg']);
      await client.query('UPDATE presentes SET quantidade_reservada = quantidade_reservada - 1 WHERE id = ANY($1)', [giftIds]);
    } else {
      console.error('❌ Falha no RPC:', rpcResult[0].reservar_multiplos_presentes_v1.message);
    }

  } catch (err) {
    console.error('❌ Erro no teste:', err);
  } finally {
    await client.end();
  }
}

testRpc();
