import * as cheerio from 'cheerio';
import { BaseScraper } from './base';

/**
 * Scraper para Casas Bahia
 * Extrai preço de produtos na Casas Bahia
 */
export class CasasBahiaScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Seletores para Casas Bahia
      const priceSelectors = [
        '[data-testid="price-value"]',
        '.sales-price',
        '[class*="Price"]',
        '.price',
      ];

      let price: number | null = null;

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          price = this.extractPrice(priceText);

          if (price && price > 0) {
            console.log(`[Casas Bahia] Preço encontrado: R$ ${price}`);
            break;
          }
        }
      }

      // Verifica disponibilidade
      const outOfStock =
        $('body').text().includes('Produto indisponível') ||
        $('body').text().includes('Esgotado') ||
        $('.unavailable').length > 0;

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado' : undefined,
      };
    } catch (error) {
      console.error('[Casas Bahia] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
