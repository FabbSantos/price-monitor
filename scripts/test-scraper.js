/**
 * Script para testar scrapers individualmente
 * Execute: node scripts/test-scraper.js
 */

const axios = require('axios');
const cheerio = require('cheerio');

const TEST_URLS = {
  amazon: 'https://www.amazon.com.br/s?k=TCL+C755+65',
  casasbahia: 'https://www.casasbahia.com.br/tv-c755-65/b',
  magazineluiza: 'https://www.magazineluiza.com.br/busca/tcl+c755+65/',
  mercadolivre: 'https://lista.mercadolivre.com.br/tcl-c755-65',
};

async function testScraper(store, url) {
  console.log(`\n🔍 Testando ${store}...`);
  console.log(`   URL: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    console.log(`   ✅ Página carregada (${response.data.length} bytes)`);
    console.log(`   Status: ${response.status}`);

    // Tenta encontrar elementos de preço
    const possibleSelectors = [
      '.a-price-whole',
      '[data-testid="price-value"]',
      '.price',
      '[class*="price"]',
      '[class*="Price"]',
    ];

    console.log(`   Procurando seletores de preço...`);

    possibleSelectors.forEach((selector) => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   ✅ Encontrado: ${selector} (${elements.length} elementos)`);
        console.log(`      Primeiro valor: "${elements.first().text().trim().substring(0, 50)}"`);
      }
    });
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Teste de Scrapers\n');
  console.log('Este script testa se as páginas podem ser acessadas.');
  console.log('Use os resultados para ajustar os seletores CSS.\n');

  for (const [store, url] of Object.entries(TEST_URLS)) {
    await testScraper(store, url);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay entre requests
  }

  console.log('\n✅ Testes concluídos!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Configure URLs reais em config/products.json');
  console.log('   2. Ajuste os seletores CSS nos scrapers se necessário');
  console.log('   3. Execute npm run dev e teste manualmente');
}

main();
