import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import productsConfig from '../../../../config/products.json';

/**
 * API Route para buscar preços do Supabase
 * GET /api/prices
 */
export async function GET() {
  try {
    // Cria cliente FRESCO para evitar cache
    const supabase = getSupabaseAdmin();

    // 1. Busca timestamp da última verificação
    const { data: checkData, error: checkError } = await supabase
      .from('price_checks')
      .select('last_check')
      .eq('id', 1)
      .single();

    if (checkError) {
      console.error('[API /prices] Erro ao buscar last_check:', checkError);
    }

    const lastCheck = checkData?.last_check || null;

    // 2. Busca preços atuais
    const { data: pricesData, error: pricesError } = await supabase
      .from('current_prices')
      .select('*')
      .order('checked_at', { ascending: false });

    if (pricesError) {
      console.error('[API /prices] Erro ao buscar current_prices:', pricesError);
      throw pricesError;
    }

    // 3. Busca histórico (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historyData, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .gte('checked_at', thirtyDaysAgo.toISOString())
      .order('checked_at', { ascending: true });

    if (historyError) {
      console.error('[API /prices] Erro ao buscar price_history:', historyError);
    }

    // 4. Formata dados para o frontend
    const prices = pricesData?.map(p => {
      // Busca informações do produto e loja no config
      const product = productsConfig.products.find(prod => prod.id === p.product_id);
      const store = productsConfig.stores.find(s => s.id === p.store);

      return {
        productId: p.product_id,
        productName: product?.name || p.product_id,
        store: p.store,
        storeName: store?.name || p.store,
        price: p.price ? Number(p.price) : null,
        url: product?.urls[p.store as keyof typeof product.urls] || '',
        timestamp: p.checked_at,
        error: p.error,
        available: p.available,
      };
    }) || [];

    // 5. Formata histórico por produto/loja
    const history: Record<string, Array<{ date: string; price: number }>> = {};

    historyData?.forEach(h => {
      const key = `${h.product_id}-${h.store}`;
      if (!history[key]) {
        history[key] = [];
      }
      history[key].push({
        date: h.checked_at,
        price: Number(h.price),
      });
    });

    return NextResponse.json({
      success: true,
      lastCheck,
      prices,
      history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /prices] Erro geral:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar preços',
        lastCheck: null,
        prices: [],
        history: {},
      },
      { status: 500 }
    );
  }
}
