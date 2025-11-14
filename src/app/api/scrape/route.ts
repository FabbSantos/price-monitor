import { NextRequest, NextResponse } from 'next/server';
import { getScraperForStore } from '@/lib/scrapers';
import { getNotifier } from '@/lib/notifier';
import { getNtfyNotifier } from '@/lib/notifier-ntfy';
import { PriceData } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabase';
import productsConfig from '../../../../config/products.json';

/**
 * Salva preços no Supabase
 */
async function savePricesToSupabase(prices: PriceData[]) {
  try {
    // Cria cliente FRESCO para evitar cache
    const supabase = getSupabaseAdmin();
    const timestamp = new Date().toISOString();

    console.log('[Supabase] Iniciando salvamento de', prices.length, 'preços...');

    // 1. Atualiza timestamp da última verificação
    const { data: checkData, error: checkError } = await supabase
      .from('price_checks')
      .update({ last_check: timestamp })
      .eq('id', 1)
      .select();

    if (checkError) {
      console.error('[Supabase] ERRO ao atualizar price_checks:', checkError);
    } else {
      console.log('[Supabase] price_checks atualizado:', checkData);
    }

    // 2. UPSERT dos preços atuais (substitui preços antigos)
    const currentPricesData = prices.map(p => ({
      product_id: p.productId,
      store: p.store,
      price: p.price,
      available: p.available,
      error: p.error || null,
      checked_at: timestamp,
    }));

    console.log('[Supabase] Fazendo UPSERT de', currentPricesData.length, 'preços...');

    const { data: pricesData, error: pricesError } = await supabase
      .from('current_prices')
      .upsert(currentPricesData, {
        onConflict: 'product_id,store',
      })
      .select();

    if (pricesError) {
      console.error('[Supabase] ERRO ao salvar current_prices:', pricesError);
    } else {
      console.log('[Supabase] current_prices salvos:', pricesData?.length, 'linhas');
    }

    // 3. Adiciona ao histórico apenas se houve mudança significativa (>5%)
    await addToHistoryIfChanged(supabase, prices);

    console.log('[Supabase] ✅ Salvamento concluído com sucesso');
  } catch (error) {
    console.error('[Supabase] ❌ Erro geral ao salvar preços:', error);
    throw error; // Re-throw para ver no log
  }
}

/**
 * Adiciona ao histórico se o preço mudou >5%
 */
async function addToHistoryIfChanged(supabase: ReturnType<typeof getSupabaseAdmin>, prices: PriceData[]) {
  try {
    const historyEntries = [];

    for (const currentPrice of prices) {
      if (!currentPrice.price) continue;

      // Busca último preço registrado
      const { data: lastPrice } = await supabase
        .from('price_history')
        .select('price')
        .eq('product_id', currentPrice.productId)
        .eq('store', currentPrice.store)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      // Se não tem histórico, adiciona
      if (!lastPrice) {
        historyEntries.push({
          product_id: currentPrice.productId,
          store: currentPrice.store,
          price: currentPrice.price,
          checked_at: currentPrice.timestamp,
        });
        continue;
      }

      // Calcula diferença percentual
      const priceChange = Math.abs((currentPrice.price - lastPrice.price) / lastPrice.price);

      // Se mudou >5%, adiciona ao histórico
      if (priceChange >= 0.05) {
        historyEntries.push({
          product_id: currentPrice.productId,
          store: currentPrice.store,
          price: currentPrice.price,
          checked_at: currentPrice.timestamp,
        });

        console.log(
          `[History] Mudança de ${(priceChange * 100).toFixed(1)}% para ${currentPrice.productId} em ${currentPrice.store}`
        );
      }
    }

    if (historyEntries.length > 0) {
      const { error } = await supabase
        .from('price_history')
        .insert(historyEntries);

      if (error) {
        console.error('[Supabase] Erro ao salvar histórico:', error);
      } else {
        console.log(`[History] ${historyEntries.length} mudanças registradas`);
      }
    }
  } catch (error) {
    console.error('[Supabase] Erro ao verificar histórico:', error);
  }
}

/**
 * API Route para fazer scraping de preços
 * GET /api/scrape
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[API] Iniciando scraping de preços...');

    const results: PriceData[] = [];
    const notifier = getNotifier();
    const ntfyNotifier = getNtfyNotifier();

    // Itera por cada produto
    for (const product of productsConfig.products) {
      // Itera por cada loja habilitada
      for (const store of productsConfig.stores) {
        if (!store.enabled) continue;

        const url = product.urls[store.id as keyof typeof product.urls];
        if (!url) continue;

        console.log(`[API] Scraping ${product.name} em ${store.name}...`);

        try {
          const scraper = getScraperForStore(store.id);
          const result = await scraper.scrape(url);

          const priceData: PriceData = {
            productId: product.id,
            productName: product.name,
            store: store.id,
            storeName: store.name,
            price: result.price,
            url,
            timestamp: new Date().toISOString(),
            error: result.error,
            available: result.available,
          };

          results.push(priceData);

          // Verifica se deve notificar
          if (priceData.price && priceData.price <= product.targetPrice) {
            console.log(`[API] 🎯 ALERTA: ${product.name} em ${store.name} por R$ ${priceData.price}`);

            // Notifica por email E ntfy
            await Promise.all([
              notifier.notify(priceData, product.targetPrice),
              ntfyNotifier.notify(priceData, product.targetPrice),
            ]);
          }
        } catch (error) {
          console.error(`[API] Erro ao scraping ${product.name} em ${store.name}:`, error);

          // Adiciona resultado com erro
          results.push({
            productId: product.id,
            productName: product.name,
            store: store.id,
            storeName: store.name,
            price: null,
            url,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            available: false,
          });
        }
      }
    }

    // Salva os resultados no Supabase
    await savePricesToSupabase(results);

    const duration = Date.now() - startTime;

    console.log(`[API] Scraping concluído em ${duration}ms. ${results.length} preços coletados.`);

    // Envia summary via ntfy
    const targetPricesMap = new Map(
      productsConfig.products.map(p => [p.id, p.targetPrice])
    );
    await ntfyNotifier.sendSummary(results, targetPricesMap);

    // Busca os dados salvos do banco para retornar (igual /api/prices)
    // Usa cliente FRESCO para garantir dados atualizados
    const supabaseRead = getSupabaseAdmin();
    const { data: checkData } = await supabaseRead
      .from('price_checks')
      .select('last_check')
      .eq('id', 1)
      .single();

    const { data: historyData } = await supabaseRead
      .from('price_history')
      .select('*')
      .order('checked_at', { ascending: true });

    // Formata histórico
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
      prices: results,
      lastCheck: checkData?.last_check || new Date().toISOString(),
      history,
      timestamp: new Date().toISOString(),
      duration,
    });
  } catch (error) {
    console.error('[API] Erro geral no scraping:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
