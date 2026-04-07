import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase URL ou Anon Key não configuradas no .env.')
  }
}

// O cliente é um singleton para evitar múltiplas instâncias
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
