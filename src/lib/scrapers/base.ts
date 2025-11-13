import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Classe base para scrapers
 * Implementa funcionalidades comuns e headers apropriados
 */
export abstract class BaseScraper {
  protected userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  /**
   * Obtém um User-Agent aleatório para evitar bloqueios
   */
  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Faz requisição HTTP com retry e headers apropriados
   */
  protected async fetchPage(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        // Delay entre 1-3 segundos para não ser agressivo
        await this.delay(1000 + Math.random() * 2000);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 15000,
          maxRedirects: 5,
        });

        return response.data;
      } catch (error) {
        console.error(`[Scraper] Tentativa ${i + 1}/${retries} falhou para ${url}:`, error);

        if (i === retries - 1) {
          throw error;
        }

        // Aguarda antes de tentar novamente (backoff exponencial)
        await this.delay(2000 * (i + 1));
      }
    }

    throw new Error('Todas as tentativas falharam');
  }

  /**
   * Faz requisição com referer e headers extras (para sites com anti-bot mais forte)
   */
  protected async fetchPageWithReferer(url: string, retries = 3): Promise<string> {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    for (let i = 0; i < retries; i++) {
      try {
        // Delay entre 2-4 segundos para não ser agressivo
        await this.delay(2000 + Math.random() * 2000);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': baseUrl,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'max-age=0',
          },
          timeout: 20000,
          maxRedirects: 5,
        });

        return response.data;
      } catch (error) {
        console.error(`[Scraper] Tentativa ${i + 1}/${retries} falhou para ${url}:`, error);

        if (i === retries - 1) {
          throw error;
        }

        // Aguarda antes de tentar novamente (backoff exponencial maior)
        await this.delay(3000 * (i + 1));
      }
    }

    throw new Error('Todas as tentativas falharam');
  }

  /**
   * Extrai preço de uma string
   */
  protected extractPrice(priceText: string): number | null {
    if (!priceText) return null;

    // Remove tudo exceto números, vírgula e ponto
    const cleaned = priceText
      .replace(/[^\d,\.]/g, '')
      .replace(/\./g, '') // Remove pontos de milhar
      .replace(',', '.'); // Converte vírgula decimal para ponto

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Helper para delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Método abstrato que cada scraper deve implementar
   */
  abstract scrape(url: string): Promise<{
    price: number | null;
    available: boolean;
    error?: string;
  }>;
}
