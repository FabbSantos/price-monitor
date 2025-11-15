/**
 * Script para testar se o cron está conseguindo chamar a API
 */

import https from 'https';
import http from 'http';

// Configura qual URL testar
const IS_PRODUCTION = process.argv.includes('--prod');
const url = IS_PRODUCTION
  ? 'https://seu-app.vercel.app/api/scrape'  // Troque pela sua URL da Vercel
  : 'http://localhost:3000/api/scrape';

console.log('================================================================================');
console.log('TESTE DE CRON JOB');
console.log('================================================================================');
console.log('URL:', url);
console.log('Timestamp:', new Date().toISOString());
console.log('Simulando chamada do cron...');
console.log('================================================================================\n');

const protocol = IS_PRODUCTION ? https : http;
const urlObj = new URL(url);

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port,
  path: urlObj.pathname,
  method: 'GET',
  headers: {
    'User-Agent': 'curl/7.68.0 (cron-simulator)',
  }
};

const req = protocol.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('\nResponse Body:');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));

      console.log('\n================================================================================');
      console.log('RESULTADO:');
      console.log('Success:', json.success);
      console.log('Preços coletados:', json.prices?.length || 0);
      console.log('LastCheck:', json.lastCheck);
      console.log('================================================================================');
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERRO:', error.message);
  console.log('================================================================================');
});

req.setTimeout(120000); // 2 minutos timeout

req.end();
