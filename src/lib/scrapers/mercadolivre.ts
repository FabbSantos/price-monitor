import * as cheerio from 'cheerio';
import { BaseScraper } from './base';

/**
 * Scraper para Mercado Livre
 * Extrai preço de produtos no Mercado Livre
 */
export class MercadoLivreScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Seletores para Mercado Livre
      const priceSelectors = [
        '.price-tag-fraction',
        '.andes-money-amount__fraction',
        '[class*="price-tag"]',
        '.price',
      ];

      let price: number | null = null;

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          price = this.extractPrice(priceText);

          if (price && price > 0) {
            console.log(`[Mercado Livre] Preço encontrado: R$ ${price}`);
            break;
          }
        }
      }

      // Verifica disponibilidade
      const outOfStock =
        $('body').text().includes('Sem estoque') ||
        $('body').text().includes('Produto pausado') ||
        $('.item-conditions').text().includes('Pausado');

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado' : undefined,
      };
    } catch (error) {
      console.error('[Mercado Livre] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
