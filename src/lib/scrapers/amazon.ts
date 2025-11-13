import * as cheerio from 'cheerio';
import { BaseScraper } from './base';

/**
 * Scraper para Amazon BR
 * Extrai preço de produtos na Amazon
 */
export class AmazonScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Foca apenas na área do produto principal (não em produtos relacionados)
      const mainProduct = $('#dp, #ppd, .dp-container, #centerCol');

      // Amazon tem múltiplos seletores possíveis para preço
      const priceSelectors = [
        '.a-price-whole',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#corePriceDisplay_desktop_feature_div .a-price-whole',
        '.a-price[data-a-size="xl"] .a-price-whole',
        '[data-a-color="price"] .a-offscreen',
      ];

      let price: number | null = null;

      // Procura APENAS dentro da área do produto principal
      for (const selector of priceSelectors) {
        const element = mainProduct.find(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          price = this.extractPrice(priceText);

          if (price && price > 0) {
            console.log(`[Amazon] Preço encontrado: R$ ${price} (seletor: ${selector})`);
            break;
          }
        }
      }

      // Se não encontrou na área principal, tenta a página toda (fallback)
      if (!price) {
        for (const selector of priceSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const priceText = element.text().trim();
            price = this.extractPrice(priceText);

            if (price && price > 0) {
              console.log(`[Amazon] Preço encontrado (fallback): R$ ${price}`);
              break;
            }
          }
        }
      }

      // Verifica disponibilidade
      const outOfStock =
        $('body').text().includes('Indisponível') ||
        $('body').text().includes('Fora de estoque') ||
        $('#availability .a-color-price').length > 0;

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado na página. Verifique o link.' : undefined,
      };
    } catch (error) {
      console.error('[Amazon] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro ao acessar a página',
      };
    }
  }
}
