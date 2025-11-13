import * as cheerio from 'cheerio';
import { BaseScraper } from './base';

/**
 * Scraper para Magazine Luiza
 * Extrai preço de produtos no Magazine Luiza
 */
export class MagazineLuizaScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Foca na área do produto principal
      const mainProduct = $('.product-detail, .main-product, [data-testid="product-page"]');

      // Seletores para Magazine Luiza (mais específicos)
      const priceSelectors = [
        '[data-testid="price-value"]',
        '[data-testid="price-value-currency-split"]',
        '.price-template__text',
        '.sc-price-current',
      ];

      let price: number | null = null;

      // Procura na área principal primeiro
      if (mainProduct.length > 0) {
        for (const selector of priceSelectors) {
          const element = mainProduct.find(selector).first();
          if (element.length > 0) {
            const priceText = element.text().trim();
            price = this.extractPrice(priceText);

            if (price && price > 0) {
              console.log(`[Magazine Luiza] Preço encontrado: R$ ${price} (seletor: ${selector})`);
              break;
            }
          }
        }
      }

      // Fallback: procura na página toda
      if (!price) {
        for (const selector of priceSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const priceText = element.text().trim();
            price = this.extractPrice(priceText);

            if (price && price > 0) {
              console.log(`[Magazine Luiza] Preço encontrado (fallback): R$ ${price}`);
              break;
            }
          }
        }
      }

      // Verifica disponibilidade
      const outOfStock =
        $('body').text().includes('Produto indisponível') ||
        $('body').text().includes('Sem estoque') ||
        $('.unavailable').length > 0;

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado na página. Verifique o link.' : undefined,
      };
    } catch (error) {
      console.error('[Magazine Luiza] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro ao acessar a página',
      };
    }
  }
}
