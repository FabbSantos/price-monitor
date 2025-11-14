import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Cliente Supabase para uso no frontend (browser)
 * Usa ANON_KEY com Row Level Security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente Supabase para uso no backend (API routes)
 * Usa SERVICE_ROLE_KEY para bypass RLS quando necessário
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
