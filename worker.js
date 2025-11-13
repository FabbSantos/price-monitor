/**
 * Worker para monitoramento automático 24/7
 * Execute: node worker.js
 *
 * Este script roda em background e faz scraping automaticamente
 * a cada X minutos, mesmo com o browser fechado.
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '30') * 60 * 1000; // minutos -> ms

console.log('🤖 Worker de Monitoramento Iniciado\n');
console.log(`📡 API: ${API_URL}`);
console.log(`⏰ Intervalo: ${CHECK_INTERVAL / 60000} minutos\n`);

let isRunning = false;

/**
 * Faz scraping dos preços
 */
async function scrape() {
  if (isRunning) {
    console.log('⚠️  Scraping anterior ainda em andamento, pulando...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log(`[${new Date().toLocaleString('pt-BR')}] 🔍 Iniciando scraping...`);

    const response = await axios.get(`${API_URL}/api/scrape`, {
      timeout: 5 * 60 * 1000, // 5 minutos de timeout
    });

    const data = response.data;
    const duration = Date.now() - startTime;

    if (data.success) {
      console.log(`✅ Scraping concluído em ${duration}ms`);
      console.log(`📊 ${data.prices.length} preços coletados`);

      // Mostra preços que atingiram o alvo
      const alerts = data.prices.filter(p => {
        // Precisa carregar o targetPrice do config
        // Simplificado aqui: assumimos que o backend já fez a checagem
        return p.available && p.price !== null;
      });

      if (alerts.length > 0) {
        console.log(`\n🎯 ALERTAS:\n`);
        alerts.forEach(alert => {
          console.log(`   - ${alert.productName} em ${alert.storeName}: R$ ${alert.price}`);
        });
      }

      console.log(`\n⏳ Próxima checagem em ${CHECK_INTERVAL / 60000} minutos...\n`);
    } else {
      console.error('❌ Erro no scraping:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Certifique-se que o servidor Next.js está rodando:');
      console.error('   npm run dev (em outro terminal)\n');
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Verifica se o servidor está disponível
 */
async function checkServer() {
  try {
    await axios.get(`${API_URL}/api/prices`, { timeout: 5000 });
    console.log('✅ Servidor Next.js detectado\n');
    return true;
  } catch (error) {
    console.error('❌ Servidor Next.js não encontrado!');
    console.error('💡 Inicie o servidor em outro terminal:');
    console.error('   npm run dev\n');
    console.error('Tentando novamente em 10 segundos...\n');
    return false;
  }
}

/**
 * Loop principal
 */
async function main() {
  // Verifica se o servidor está rodando
  while (!(await checkServer())) {
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Primeira execução imediata
  await scrape();

  // Configura execução periódica
  setInterval(scrape, CHECK_INTERVAL);

  // Mantém o processo rodando
  process.on('SIGINT', () => {
    console.log('\n\n👋 Worker finalizado. Até logo!');
    process.exit(0);
  });

  console.log('💤 Worker em execução. Pressione Ctrl+C para parar.\n');
}

// Inicia o worker
main().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
