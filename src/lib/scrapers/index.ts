import { AmazonScraper } from './amazon';
import { CasasBahiaScraper } from './casasbahia';
import { MagazineLuizaScraper } from './magazineluiza';
import { MercadoLivreScraper } from './mercadolivre';
import { TerabyteScraper } from './terabyte';
import { BaseScraper } from './base';

/**
 * Factory para criar scrapers baseado na loja
 */
export function getScraperForStore(storeId: string): BaseScraper {
  switch (storeId.toLowerCase()) {
    case 'amazon':
      return new AmazonScraper();
    case 'casasbahia':
      return new CasasBahiaScraper();
    case 'magazineluiza':
      return new MagazineLuizaScraper();
    case 'mercadolivre':
      return new MercadoLivreScraper();
    case 'terabyte':
      return new TerabyteScraper();
    default:
      throw new Error(`Scraper não encontrado para a loja: ${storeId}`);
  }
}

export { BaseScraper };
