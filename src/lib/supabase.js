import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] Variaveis ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local (local) ou no Vercel (Production/Preview).'
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'sb_publishable_placeholder_key'
)
