import { createClient } from '@supabase/supabase-js';

// Configurações com suporte a variáveis de ambiente (.env) ou valores fallback para preview local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-setgear.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const isRealSupabaseConfigured = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_URL !== 'https://mock-setgear.supabase.co'
  );
};
