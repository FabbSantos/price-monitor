import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Endpoint de debug para verificar estado do Supabase
 * GET /api/debug
 */
export async function GET() {
  try {
    // Cria cliente FRESCO para evitar cache
    const supabase = getSupabaseAdmin();

    // 1. Verifica environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Debug] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[Debug] Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...');
    console.log('[Debug] Usando cliente FRESCO (timestamp:', Date.now(), ')');

    // 2. Tenta buscar última verificação
    const { data: checkData, error: checkError } = await supabase
      .from('price_checks')
      .select('*')
      .eq('id', 1)
      .single();

    console.log('[Debug] Query result:', checkData);
    console.log('[Debug] Query error:', checkError);

    // 3. Conta preços atuais
    const { count: pricesCount, error: pricesError } = await supabase
      .from('current_prices')
      .select('*', { count: 'exact', head: true });

    // 4. Conta histórico
    const { count: historyCount, error: historyError} = await supabase
      .from('price_history')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: hasUrl,
        hasSupabaseAnonKey: hasAnonKey,
        hasSupabaseServiceKey: hasServiceKey,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'local',
      },
      database: {
        lastCheck: checkData?.last_check || null,
        lastCheckError: checkError?.message || null,
        currentPricesCount: pricesCount || 0,
        pricesError: pricesError?.message || null,
        historyCount: historyCount || 0,
        historyError: historyError?.message || null,
      },
      timeSinceLastCheck: checkData?.last_check
        ? Math.floor((Date.now() - new Date(checkData.last_check).getTime()) / 1000 / 60)
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
