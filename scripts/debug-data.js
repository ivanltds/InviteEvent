const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const { data: profiles, error: pError } = await supabase.from('perfis').select('*');
  if (pError) console.error('Error fetching profiles:', pError);
  else console.log('Profiles:', profiles);

  const { data: events, error: eError } = await supabase.from('eventos').select('*');
  if (eError) console.error('Error fetching events:', eError);
  else console.log('Events:', events);

  const { data: orgs, error: oError } = await supabase.from('evento_organizadores').select('*');
  if (oError) console.error('Error fetching organizers:', oError);
  else console.log('Organizers:', orgs);
}

test();
