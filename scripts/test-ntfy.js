/**
 * Script para testar notificações ntfy
 * Execute: node scripts/test-ntfy.js
 */

require('dotenv').config({ path: '.env.local' });

async function testNtfy() {
  console.log('📱 Testando notificações ntfy...\n');

  const server = process.env.NTFY_SERVER || 'https://ntfy.sh';
  const topic = process.env.NTFY_TOPIC;

  if (!topic) {
    console.error('❌ Erro: NTFY_TOPIC não configurado no .env.local');
    console.log('\n📝 Como configurar:\n');
    console.log('1. Instale o app ntfy no celular:');
    console.log('   iOS: https://apps.apple.com/app/ntfy/id1625396347');
    console.log('   Android: https://play.google.com/store/apps/details?id=io.heckel.ntfy');
    console.log('   Ou: https://ntfy.sh/app\n');
    console.log('2. Escolha um tópico único (ex: price-monitor-fabio-123)\n');
    console.log('3. No app, clique em "Subscribe" e insira o tópico\n');
    console.log('4. Adicione no .env.local:');
    console.log('   NTFY_TOPIC=price-monitor-fabio-123\n');
    process.exit(1);
  }

  console.log(`📡 Servidor: ${server}`);
  console.log(`📋 Tópico: ${topic}`);
  console.log(`🔗 URL: ${server}/${topic}\n`);

  console.log('💡 Dica: Certifique-se que você está inscrito neste tópico no app!\n');

  try {
    console.log('🔄 Enviando notificação de teste...\n');

    const message = 'Parabens! Suas notificacoes estao configuradas.\n\nVoce recebera alertas quando os precos atingirem suas metas!';

    const response = await fetch(`${server}/${topic}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': 'ntfy Funcionando',
        'Priority': 'high',
        'Tags': 'white_check_mark,tada',
      },
    });

    if (response.ok) {
      console.log('✅ Notificação enviada com sucesso!');
      console.log('\n🎉 Verifique seu celular agora!\n');
      console.log('💡 Dica: Se não recebeu, verifique:');
      console.log('   - Você está inscrito no tópico correto?');
      console.log('   - O app está aberto?');
      console.log('   - Permissões de notificação estão ativas?');
    } else {
      console.error(`❌ Erro: ${response.status} ${response.statusText}`);
      const body = await response.text();
      console.error(`   Resposta: ${body}`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar:', error.message);
  }
}

testNtfy();
