/**
 * Script de DEBUG para scraping
 * Mostra EXATAMENTE o que está sendo capturado
 * Execute: node scripts/debug-scraper.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Cole aqui a URL que você quer debugar
const TEST_URL = process.argv[2] || 'https://www.amazon.com.br/s?k=TCL+C755+65';

async function debugScraper(url) {
  console.log('🔍 DEBUG DE SCRAPING\n');
  console.log(`📍 URL: ${url}\n`);

  try {
    console.log('⏳ Fazendo requisição HTTP...\n');

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    console.log(`✅ Página carregada (${response.data.length} bytes)`);
    console.log(`📊 Status: ${response.status}\n`);

    // Salva HTML para inspeção
    const htmlFile = 'debug-page.html';
    fs.writeFileSync(htmlFile, response.data);
    console.log(`💾 HTML salvo em: ${htmlFile}\n`);

    const $ = cheerio.load(response.data);

    // Detecta qual loja é baseada na URL
    let store = 'desconhecida';
    if (url.includes('amazon')) store = 'amazon';
    else if (url.includes('casasbahia')) store = 'casasbahia';
    else if (url.includes('magazineluiza')) store = 'magazineluiza';
    else if (url.includes('mercadolivre')) store = 'mercadolivre';

    console.log(`🏪 Loja detectada: ${store}\n`);

    // Seletores por loja
    const selectors = {
      amazon: [
        '.a-price-whole',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-offscreen',
        '[data-a-color="price"] .a-offscreen',
        'span.a-price span.a-offscreen',
      ],
      casasbahia: [
        '[data-testid="price-value"]',
        '.sales-price',
        '[class*="Price"]',
        '.price',
      ],
      magazineluiza: [
        '[data-testid="price-value"]',
        '.price-template__text',
        '[class*="price"]',
        '.sc-price',
      ],
      mercadolivre: [
        '.price-tag-fraction',
        '.andes-money-amount__fraction',
        '[class*="price-tag"]',
        '.price',
      ],
    };

    const storeSelectors = selectors[store] || [];

    console.log(`🎯 Testando ${storeSelectors.length} seletores...\n`);

    let foundAny = false;

    storeSelectors.forEach((selector, index) => {
      const elements = $(selector);

      if (elements.length > 0) {
        console.log(`✅ Seletor ${index + 1}: "${selector}" → ${elements.length} elementos encontrados`);

        // Mostra os primeiros 3 elementos
        elements.slice(0, 3).each((i, el) => {
          const text = $(el).text().trim();
          const html = $(el).html()?.substring(0, 100);
          console.log(`   [${i + 1}] Texto: "${text}"`);
          console.log(`       HTML: ${html}...`);
        });

        foundAny = true;
        console.log('');
      }
    });

    if (!foundAny) {
      console.log('❌ Nenhum seletor encontrou resultados!\n');
      console.log('💡 Possíveis causas:');
      console.log('   1. URL é de busca/listagem (não de produto específico)');
      console.log('   2. Site usa JavaScript para carregar preços (precisa Puppeteer)');
      console.log('   3. Seletores desatualizados\n');
      console.log('🔧 Solução:');
      console.log('   1. Abra debug-page.html no browser');
      console.log('   2. Inspecione o elemento do preço (F12)');
      console.log('   3. Copie a classe/ID');
      console.log('   4. Adicione no scraper correspondente\n');
    }

    // Procura por palavras-chave relacionadas a preço
    console.log('🔎 Procurando por padrões de preço no HTML...\n');

    const pricePatterns = [
      /R\$\s*[\d.,]+/g,
      /[\d.,]+/g,
    ];

    const bodyText = $('body').text();
    const prices = bodyText.match(/R\$\s*[\d.,]+/g) || [];

    if (prices.length > 0) {
      console.log(`💰 Preços encontrados no HTML (${prices.slice(0, 10).length} de ${prices.length}):`);
      prices.slice(0, 10).forEach((price, i) => {
        console.log(`   ${i + 1}. ${price}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhum padrão "R$ XXX" encontrado no HTML\n');
    }

    // Verifica se é página de produto ou listagem
    console.log('📋 Análise da página:\n');

    const indicators = {
      'Página de Produto': [
        $('meta[property="og:type"]').attr('content') === 'product',
        $('[itemprop="price"]').length > 0,
        $('#productTitle').length > 0,
        $('.product-title').length > 0,
      ],
      'Página de Listagem': [
        $('.s-result-item').length > 0,
        $('.product-grid').length > 0,
        $('[data-component-type="s-search-result"]').length > 0,
      ],
    };

    Object.entries(indicators).forEach(([type, checks]) => {
      const matches = checks.filter(Boolean).length;
      const icon = matches > 0 ? '✅' : '❌';
      console.log(`${icon} ${type}: ${matches} indicadores`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📝 RESUMO\n');

    if (foundAny) {
      console.log('✅ Seletores funcionando!');
      console.log('💡 Se os preços estão errados, verifique:');
      console.log('   - A URL é do produto correto?');
      console.log('   - O seletor está pegando o elemento certo?');
    } else {
      console.log('❌ Nenhum seletor funcionou');
      console.log('💡 Próximos passos:');
      console.log('   1. Verifique se a URL é de um produto específico');
      console.log('   2. Abra debug-page.html e inspecione o preço');
      console.log('   3. Atualize os seletores no scraper');
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

if (!process.argv[2]) {
  console.log('❌ Uso: node scripts/debug-scraper.js <URL>\n');
  console.log('Exemplo:');
  console.log('  node scripts/debug-scraper.js "https://www.amazon.com.br/dp/B0CXXX"\n');
  process.exit(1);
}

debugScraper(TEST_URL);
