import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Cliente Supabase para uso no frontend (browser)
 * Usa ANON_KEY com Row Level Security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cria um cliente admin Supabase FRESCO para cada chamada
 * Evita problemas de cache/pooling
 */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'cache-control': 'no-cache',
        'x-client-info': `price-monitor-${Date.now()}`,
      },
    },
  });
}

/**
 * Cliente Supabase admin (backward compatibility)
 * @deprecated Use getSupabaseAdmin() para evitar cache
 */
export const supabaseAdmin = getSupabaseAdmin();

/**
 * Tipos TypeScript para as tabelas
 */
export interface PriceCheck {
  id: number;
  last_check: string; // ISO timestamp
  created_at: string;
}

export interface CurrentPrice {
  id: number;
  product_id: string;
  store: string;
  price: number | null;
  available: boolean;
  error: string | null;
  checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: number;
  product_id: string;
  store: string;
  price: number;
  checked_at: string;
  created_at: string;
}
