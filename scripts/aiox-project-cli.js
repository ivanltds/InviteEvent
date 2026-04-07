const postgres = require('postgres');
require('dotenv').config();

// Use the same DB URL as the project
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

const command = process.argv[2];
const args = process.argv.slice(3);

async function run() {
  console.log(`--- AIOX Project CLI: InviteEventAI ---`);

  switch (command) {
    case 'list-guests':
      const guests = await sql`SELECT nome_principal, tipo, limite_pessoas, slug FROM convites ORDER BY created_at DESC`;
      console.table(guests);
      break;

    case 'add-guest':
      if (args.length < 2) {
        console.error('Usage: add-guest <name> <limit> [tipo=individual]');
        process.exit(1);
      }
      const [name, limit, tipo = 'individual'] = args;
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      try {
        await sql`INSERT INTO convites (nome_principal, limite_pessoas, tipo, slug) VALUES (${name}, ${parseInt(limit)}, ${tipo}, ${slug})`;
        console.log(`✅ Guest "${name}" (slug: ${slug}) added successfully!`);
      } catch (err) {
        console.error(`❌ Error adding guest:`, err.message);
      }
      break;

    case 'list-rsvps':
      const rsvps = await sql`
        SELECT c.nome_principal, r.confirmados, r.status, r.mensagem 
        FROM rsvp r 
        JOIN convites c ON r.convite_id = c.id 
        ORDER BY r.created_at DESC
      `;
      console.table(rsvps);
      break;

    case 'db-status':
      try {
        const result = await sql`SELECT COUNT(*) as total_convites FROM convites`;
        const rsvpCount = await sql`SELECT COUNT(*) as total_rsvp FROM rsvp`;
        const giftCount = await sql`SELECT COUNT(*) as total_presentes FROM presentes`;
        
        console.log(`📊 DB Status:`);
        console.log(`- Total Invites: ${result[0].total_convites}`);
        console.log(`- Total RSVPs: ${rsvpCount[0].total_rsvp}`);
        console.log(`- Total Gifts: ${giftCount[0].total_presentes}`);
        console.log(`✅ Database connection is healthy!`);
      } catch (err) {
        console.error(`❌ Database connection failed:`, err.message);
      }
      break;

    case 'help':
    default:
      console.log(`Available commands:`);
      console.log(`  list-guests       List all registered invites`);
      console.log(`  add-guest         Add a new invite (name, limit, tipo)`);
      console.log(`  list-rsvps        List all RSVP responses`);
      console.log(`  db-status         Show database statistics`);
      break;
  }

  await sql.end();
}

run();
