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

      // Remove seções de produtos relacionados antes de buscar preço
      $('#similarities_feature_div').remove();
      $('#anonCarousel1').remove();
      $('#anonCarousel2').remove();
      $('#HLCXComparisonJumplink_feature_div').remove();
      $('[data-component-type="sp-sponsored-carousel"]').remove();
      $('.a-carousel-container').remove();

      // Foca ESTRITAMENTE na área do produto principal
      const mainProduct = $('#dp-container, #ppd, #centerCol');

      // Seletores específicos para preço do produto principal na Amazon BR
      const priceSelectors = [
        '#corePriceDisplay_desktop_feature_div .a-price-whole',
        '#corePriceDisplay_desktop_feature_div .a-offscreen',
        '#price_inside_buybox',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price[data-a-size="xl"] .a-price-whole',
        '.a-price[data-a-size="large"] .a-price-whole',
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

      // Verifica disponibilidade - textos específicos da Amazon BR
      const bodyText = $('body').text();
      const outOfStock =
        bodyText.includes('Não disponível') ||
        bodyText.includes('Indisponível') ||
        bodyText.includes('Fora de estoque') ||
        bodyText.includes('Não temos previsão de quando este produto estará disponível novamente') ||
        $('#availability .a-color-price').length > 0 ||
        $('#availability .a-color-state').text().includes('Indisponível');

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
