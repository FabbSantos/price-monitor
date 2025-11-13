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

      // Foca na área do produto principal
      const mainProduct = $('.ui-pdp-container, .ui-vip, #root-app');

      // Seletores atualizados para Mercado Livre
      const priceSelectors = [
        '.andes-money-amount__fraction',
        '.price-tag-fraction',
        '[class*="andes-money-amount"] [class*="fraction"]',
        '.ui-pdp-price__second-line .andes-money-amount__fraction',
        '.price-tag-amount .price-tag-fraction',
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
              console.log(`[Mercado Livre] Preço encontrado: R$ ${price} (seletor: ${selector})`);
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
              console.log(`[Mercado Livre] Preço encontrado (fallback): R$ ${price}`);
              break;
            }
          }
        }
      }

      // Verifica disponibilidade - textos específicos do ML
      const bodyText = $('body').text();
      const outOfStock =
        bodyText.includes('Este produto está indisponível no momento') ||
        bodyText.includes('Sem estoque') ||
        bodyText.includes('Produto pausado') ||
        bodyText.includes('Não disponível') ||
        $('.item-conditions').text().includes('Pausado');

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado na página. Verifique o link.' : undefined,
      };
    } catch (error) {
      console.error('[Mercado Livre] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro ao acessar a página',
      };
    }
  }
}
