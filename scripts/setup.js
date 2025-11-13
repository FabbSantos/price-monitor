/**
 * Script de setup inicial
 * Execute: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  console.log('🚀 Setup do Monitor de Preços\n');

  // Verifica se já existe .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('Arquivo .env.local já existe. Sobrescrever? (s/N): ');
    if (overwrite.toLowerCase() !== 's') {
      console.log('\n✅ Setup cancelado. Arquivo .env.local mantido.');
      rl.close();
      return;
    }
  }

  console.log('\n📧 Configuração de Email SMTP\n');

  const emailHost = await question('Host SMTP (ex: smtp.gmail.com): ');
  const emailPort = await question('Porta SMTP (587 para TLS, 465 para SSL): ');
  const emailUser = await question('Email (remetente): ');
  const emailPass = await question('Senha de APP (não use a senha normal!): ');
  const emailTo = await question('Email destino (deixe vazio para usar o mesmo): ');

  console.log('\n⏰ Configuração de Intervalo\n');
  const checkInterval = await question('Intervalo de checagem em minutos (padrão 30): ') || '30';

  // Cria o arquivo .env.local
  const envContent = `# Configurações de Email (SMTP)
EMAIL_HOST=${emailHost}
EMAIL_PORT=${emailPort}
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_TO=${emailTo || emailUser}

# Intervalo de checagem (em minutos)
CHECK_INTERVAL=${checkInterval}
`;

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Arquivo .env.local criado com sucesso!');
  console.log('\n💡 Próximos passos:\n');
  console.log('1. Edite config/products.json com URLs reais dos produtos');
  console.log('2. Teste a configuração de email:');
  console.log('   node scripts/test-email.js\n');
  console.log('3. Inicie o servidor:');
  console.log('   npm run dev\n');
  console.log('4. Acesse http://localhost:3000\n');

  rl.close();
}

setup().catch(console.error);
