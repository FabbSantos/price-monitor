import * as cheerio from 'cheerio';
import { BaseScraper } from './base';

/**
 * Scraper para Terabyte Shop
 * Extrai preço de produtos na Terabyte Shop
 */
export class TerabyteScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Seletores comuns para Terabyte Shop
      // NOTA: Estes seletores podem precisar de ajustes após testes
      const priceSelectors = [
        '.prod-new-price strong',
        '.prod-new-price',
        '.product-price strong',
        '.product-price',
        '.price strong',
        '.price',
        '[itemprop="price"]',
        '.valor-por strong',
        '.valor-por',
        '#valVista strong',
        '#valVista',
      ];

      let price: number | null = null;

      // Procura pelo preço usando os seletores
      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          price = this.extractPrice(priceText);

          if (price && price > 0) {
            console.log(`[Terabyte] Preço encontrado: R$ ${price} (seletor: ${selector})`);
            break;
          }
        }
      }

      // Fallback: procura por padrões de preço no HTML
      if (!price) {
        const bodyText = $('body').text();
        const priceMatches = bodyText.match(/R\$\s*[\d.,]+/g);

        if (priceMatches && priceMatches.length > 0) {
          // Pega o primeiro preço válido encontrado
          for (const match of priceMatches) {
            const extractedPrice = this.extractPrice(match);
            if (extractedPrice && extractedPrice > 100) { // Assume que produtos custam > R$ 100
              price = extractedPrice;
              console.log(`[Terabyte] Preço encontrado (fallback): R$ ${price}`);
              break;
            }
          }
        }
      }

      // Verifica disponibilidade
      const bodyText = $('body').text().toLowerCase();
      const outOfStock =
        bodyText.includes('produto indisponível') ||
        bodyText.includes('sem estoque') ||
        bodyText.includes('não disponível') ||
        bodyText.includes('esgotado') ||
        bodyText.includes('fora de estoque') ||
        $('.unavailable, .out-of-stock, .indisponivel').length > 0;

      // Verifica se tem botão de comprar ativo
      const hasBuyButton =
        $('button:contains("Comprar")').length > 0 ||
        $('button:contains("Adicionar")').length > 0 ||
        $('.btn-buy, .btn-comprar, .add-to-cart').length > 0;

      const isAvailable = !outOfStock && price !== null && price > 0;

      return {
        price,
        available: isAvailable,
        error: price === null ? 'Preço não encontrado na página. Verifique o link.' : undefined,
      };
    } catch (error) {
      console.error('[Terabyte] Erro ao fazer scraping:', error);
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro ao acessar a página',
      };
    }
  }
}
