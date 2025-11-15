import { NextRequest, NextResponse } from 'next/server';
import { getScraperForStore } from '@/lib/scrapers';
import { getNotifier } from '@/lib/notifier';
import { getNtfyNotifier } from '@/lib/notifier-ntfy';
import { PriceData } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabase';
import productsConfig from '../../../../config/products.json';

/**
 * Salva preços no Supabase
 * Retorna os preços que tiveram mudança significativa (para notificar)
 */
async function savePricesToSupabase(prices: PriceData[]): Promise<PriceData[]> {
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
    // Retorna os preços que mudaram para enviar notificações
    const changedPrices = await addToHistoryIfChanged(supabase, prices);

    console.log('[Supabase] ✅ Salvamento concluído com sucesso');

    return changedPrices;
  } catch (error) {
    console.error('[Supabase] ❌ Erro geral ao salvar preços:', error);
    throw error; // Re-throw para ver no log
  }
}

/**
 * Adiciona ao histórico se o preço mudou >5%
 * Retorna os preços que tiveram mudança significativa
 */
async function addToHistoryIfChanged(supabase: ReturnType<typeof getSupabaseAdmin>, prices: PriceData[]): Promise<PriceData[]> {
  const changedPrices: PriceData[] = [];

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
        changedPrices.push(currentPrice);
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
        changedPrices.push(currentPrice);

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

  return changedPrices;
}

/**
 * API Route para fazer scraping de preços
 * GET /api/scrape
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isCron = request.headers.get('user-agent')?.includes('curl') ||
                 request.headers.get('x-vercel-cron') === '1';

  console.log('='.repeat(80));
  console.log('[API] 🚀 SCRAPE INICIADO');
  console.log('[API] Timestamp:', new Date().toISOString());
  console.log('[API] Método:', request.method);
  console.log('[API] Origem:', isCron ? 'CRON JOB' : 'MANUAL');
  console.log('[API] User-Agent:', request.headers.get('user-agent'));
  console.log('='.repeat(80));

  try {
    console.log('[API] Iniciando scraping de preços em PARALELO...');

    const notifier = getNotifier();
    const ntfyNotifier = getNtfyNotifier();

    // Cria array de promises para scraping paralelo
    const scrapingTasks: Promise<PriceData>[] = [];

    for (const product of productsConfig.products) {
      for (const store of productsConfig.stores) {
        if (!store.enabled) continue;

        const url = product.urls[store.id as keyof typeof product.urls];
        if (!url) continue;

        // Cria uma promise para cada scraping
        const task = (async () => {
          console.log(`[API] 🚀 Iniciando scraping: ${product.name} em ${store.name}...`);

          try {
            const scraper = getScraperForStore(store.id);
            const result = await scraper.scrape(url);

            console.log(`[API] ✅ Completado: ${product.name} em ${store.name}`);

            return {
              productId: product.id,
              productName: product.name,
              store: store.id,
              storeName: store.name,
              price: result.price,
              url,
              timestamp: new Date().toISOString(),
              error: result.error,
              available: result.available,
            } as PriceData;
          } catch (error) {
            console.error(`[API] ❌ Erro: ${product.name} em ${store.name}:`, error);

            return {
              productId: product.id,
              productName: product.name,
              store: store.id,
              storeName: store.name,
              price: null,
              url,
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              available: false,
            } as PriceData;
          }
        })();

        scrapingTasks.push(task);
      }
    }

    console.log(`[API] 📊 Total de ${scrapingTasks.length} scraping tasks criadas. Executando em paralelo...`);

    // Executa todos os scrapings em paralelo
    const results = await Promise.all(scrapingTasks);

    console.log(`[API] 📦 Todos os scrapings completados: ${results.length} resultados`);

    // Salva os resultados no Supabase e pega os que mudaram
    const changedPrices = await savePricesToSupabase(results);

    const duration = Date.now() - startTime;

    console.log('='.repeat(80));
    console.log('[API] ✅ SCRAPE CONCLUÍDO COM SUCESSO');
    console.log('[API] Duração:', duration, 'ms');
    console.log('[API] Preços coletados:', results.length);
    console.log('[API] Preços que mudaram:', changedPrices.length);
    console.log('[API] Timestamp final:', new Date().toISOString());
    console.log('='.repeat(80));

    // Envia notificações APENAS para os preços que mudaram
    if (changedPrices.length > 0) {
      console.log(`[API] Enviando notificações para ${changedPrices.length} preços que mudaram...`);

      const targetPricesMap = new Map(
        productsConfig.products.map(p => [p.id, p.targetPrice])
      );

      for (const priceData of changedPrices) {
        const targetPrice = targetPricesMap.get(priceData.productId) || 0;

        // Só notifica se estiver abaixo do target
        if (priceData.price && priceData.price <= targetPrice) {
          console.log(`[API] 🎯 ALERTA: ${priceData.productName} em ${priceData.storeName} por R$ ${priceData.price}`);

          await Promise.all([
            notifier.notify(priceData, targetPrice),
            ntfyNotifier.notify(priceData, targetPrice),
          ]);
        }
      }

      // Envia summary via ntfy
      await ntfyNotifier.sendSummary(changedPrices, targetPricesMap);
    } else {
      console.log('[API] Nenhuma mudança de preço detectada. Sem notificações.');
    }

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

/**
 * Suporta POST também (caso o cron use POST em vez de GET)
 */
export async function POST(request: NextRequest) {
  console.log('[API] ⚠️  POST recebido, redirecionando para GET handler...');
  return GET(request);
}
