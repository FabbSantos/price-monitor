/**
 * Script para testar configuração de email
 * Execute: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testando configuração de email...\n');

  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  };

  // Valida configurações
  if (!config.host || !config.user || !config.pass) {
    console.error('❌ Erro: Configurações de email não encontradas no .env.local');
    console.log('\nConfigure as seguintes variáveis:');
    console.log('- EMAIL_HOST');
    console.log('- EMAIL_PORT');
    console.log('- EMAIL_USER');
    console.log('- EMAIL_PASS');
    console.log('- EMAIL_TO (opcional)');
    process.exit(1);
  }

  console.log('📧 Configurações:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   To: ${config.to}`);
  console.log('');

  try {
    // Cria transportador
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    console.log('🔄 Enviando email de teste...');

    // Envia email de teste
    const info = await transporter.sendMail({
      from: config.user,
      to: config.to,
      subject: '✅ Teste de Email - Monitor de Preços',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">✅ Email Configurado com Sucesso!</h1>
          <p>Se você recebeu este email, suas configurações SMTP estão corretas.</p>
          <p>O Monitor de Preços está pronto para enviar notificações!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}<br>
            Host: ${config.host}<br>
            Porta: ${config.port}
          </p>
        </div>
      `,
    });

    console.log('✅ Email enviado com sucesso!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log('\n🎉 Configuração válida! Você receberá alertas quando os preços atingirem suas metas.');
  } catch (error) {
    console.error('\n❌ Erro ao enviar email:');
    console.error(error.message);
    console.log('\n💡 Dicas:');
    console.log('   - Verifique se está usando uma senha de APP (não a senha normal)');
    console.log('   - Para Gmail, acesse: https://myaccount.google.com/apppasswords');
    console.log('   - Certifique-se que a verificação em 2 etapas está ativa');
    process.exit(1);
  }
}

testEmail();
