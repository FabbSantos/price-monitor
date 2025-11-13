import { NextRequest, NextResponse } from 'next/server';
import { getScraperForStore } from '@/lib/scrapers';
import { saveLatestPrices, addToHistory } from '@/lib/storage';
import { getNotifier } from '@/lib/notifier';
import { getNtfyNotifier } from '@/lib/notifier-ntfy';
import { PriceData } from '@/lib/types';
import productsConfig from '../../../../config/products.json';

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

    // Salva os resultados
    saveLatestPrices(results);
    addToHistory(results);

    const duration = Date.now() - startTime;

    console.log(`[API] Scraping concluído em ${duration}ms. ${results.length} preços coletados.`);

    // Envia summary via ntfy
    const targetPricesMap = new Map(
      productsConfig.products.map(p => [p.id, p.targetPrice])
    );
    await ntfyNotifier.sendSummary(results, targetPricesMap);

    return NextResponse.json({
      success: true,
      prices: results,
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
