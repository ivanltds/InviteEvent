const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('--- Iniciando Migração de Banco (via PG) ---');
  try {
    await client.connect();
    console.log('✅ Conectado ao banco.');

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comprovantes' AND column_name = 'mensagem') THEN
          ALTER TABLE comprovantes ADD COLUMN mensagem TEXT;
        END IF;
      END
      $$;
    `);
    console.log('✅ Coluna "mensagem" adicionada.');

    await client.query(`
      CREATE OR REPLACE FUNCTION reservar_multiplos_presentes_v1(
        p_presente_ids UUID[],
        p_url_comprovante TEXT,
        p_mensagem TEXT DEFAULT NULL,
        p_convite_id UUID DEFAULT NULL,
        p_convidado_nome TEXT DEFAULT 'Convidado via Site'
      ) RETURNS JSON AS $$
      DECLARE
        v_presente_id UUID;
        v_total INTEGER;
        v_reservado INTEGER;
      BEGIN
        FOREACH v_presente_id IN ARRAY p_presente_ids
        LOOP
          SELECT quantidade_total, quantidade_reservada INTO v_total, v_reservado
          FROM presentes WHERE id = v_presente_id FOR UPDATE;

          IF v_reservado >= v_total THEN
            RAISE EXCEPTION 'O item com ID % acabou de esgotar.', v_presente_id;
          END IF;

          UPDATE presentes 
          SET 
            quantidade_reservada = v_reservado + 1,
            status = CASE WHEN (v_reservado + 1) >= v_total THEN 'reservado' ELSE 'disponivel' END
          WHERE id = v_presente_id;

          INSERT INTO comprovantes (presente_id, convite_id, convidado_nome, url_comprovante, mensagem)
          VALUES (v_presente_id, p_convite_id, p_convidado_nome, p_url_comprovante, p_mensagem);
        END LOOP;

        RETURN json_build_object('success', true, 'message', 'Sua cesta de presentes foi reservada com sucesso!');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'message', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ RPC Criada.');

    await client.query(`GRANT EXECUTE ON FUNCTION reservar_multiplos_presentes_v1 TO anon, authenticated, service_role;`);
    console.log('✅ Permissões concedidas.');

  } catch (err) {
    console.error('❌ Erro na migração:', err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
