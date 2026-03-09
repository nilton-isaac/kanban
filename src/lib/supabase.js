import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('⚠️  Variáveis de ambiente Supabase não configuradas. Crie um arquivo .env.local')
}

export const supabase = createClient(url, key)
