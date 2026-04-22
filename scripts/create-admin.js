const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

// Configurações
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Uso: node scripts/create-admin.js <email> <senha>');
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createAdmin() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não encontrada no .env');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📡 Conectado ao banco de dados.');

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Criar usuário no schema auth (Hacky mas eficiente via SQL direto)
    // Nota: Em produção, o ideal é usar o Admin API do Supabase, 
    // mas via SQL podemos forçar a criação se estivermos bloqueados.
    console.log(`👤 Criando usuário admin: ${email}...`);
    
    // Inserção na tabela auth.users
    // Em Supabase, a senha é armazenada com hash bcrypt. 
    // Como não temos bcrypt no node puro sem deps, vamos apenas inserir e avisar 
    // que o usuário pode precisar dar "Redefinir Senha" ou usaremos o SQL do Supabase.
    
    // UPDATE: É mais seguro gerar o SQL para o Dashboard.
    console.log('\n--- SQL PARA EXECUTAR NO DASHBOARD DO SUPABASE ---');
    console.log(`
-- 1. Criar Usuário no Auth (ID: ${userId})
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
VALUES (
  '${userId}', 
  '${email}', 
  crypt('${password}', gen_salt('bf')), 
  now(), 
  'authenticated', 
  'authenticated', 
  now(), 
  now()
) ON CONFLICT (email) DO NOTHING;

-- 2. Criar Perfil Público
INSERT INTO public.perfis (id, email, is_master, created_at)
VALUES ('${userId}', '${email}', true, now())
ON CONFLICT (id) DO UPDATE SET is_master = true;

-- 3. Notificar Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
    `);

    console.log('\n--- FIM DO SQL ---');
    console.log('\n⚠️ Copie o SQL acima e execute-o no SQL Editor do seu projeto Supabase.');
    console.log('Isso garantirá que o usuário seja criado com a senha criptografada correta.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
