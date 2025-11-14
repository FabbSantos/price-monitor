/**
 * Script para testar conexão com Supabase
 * Execute: node scripts/test-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📡 URL:', supabaseUrl);
  console.log('🔑 Service Role Key:', supabaseKey.substring(0, 20) + '...\n');

  try {
    // Teste 1: Verificar tabela price_checks
    console.log('1️⃣  Testando tabela price_checks...');
    const { data: checks, error: checksError } = await supabase
      .from('price_checks')
      .select('*')
      .eq('id', 1)
      .single();

    if (checksError) {
      console.error('   ❌ ERRO:', checksError.message);
      console.error('   💡 Execute o SQL schema em: https://supabase.com/dashboard\n');
    } else {
      console.log('   ✅ Tabela existe! Last check:', checks?.last_check || 'nunca');
    }

    // Teste 2: Verificar tabela current_prices
    console.log('\n2️⃣  Testando tabela current_prices...');
    const { data: prices, error: pricesError } = await supabase
      .from('current_prices')
      .select('*')
      .limit(5);

    if (pricesError) {
      console.error('   ❌ ERRO:', pricesError.message);
    } else {
      console.log('   ✅ Tabela existe! Registros:', prices?.length || 0);
      if (prices && prices.length > 0) {
        prices.forEach(p => {
          console.log(`      - ${p.product_id} @ ${p.store}: R$ ${p.price}`);
        });
      }
    }

    // Teste 3: Verificar tabela price_history
    console.log('\n3️⃣  Testando tabela price_history...');
    const { data: history, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .limit(5);

    if (historyError) {
      console.error('   ❌ ERRO:', historyError.message);
    } else {
      console.log('   ✅ Tabela existe! Registros:', history?.length || 0);
      if (history && history.length > 0) {
        history.forEach(h => {
          console.log(`      - ${h.product_id} @ ${h.store}: R$ ${h.price} (${new Date(h.checked_at).toLocaleString('pt-BR')})`);
        });
      }
    }

    // Teste 4: Tentar INSERT
    console.log('\n4️⃣  Testando INSERT (atualizar price_checks)...');
    const { data: updateData, error: updateError } = await supabase
      .from('price_checks')
      .update({ last_check: new Date().toISOString() })
      .eq('id', 1)
      .select();

    if (updateError) {
      console.error('   ❌ ERRO:', updateError.message);
    } else {
      console.log('   ✅ UPDATE funcionou! Dados:', updateData);
    }

    console.log('\n✅ Testes concluídos!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Se viu erros "table not found", execute o schema SQL');
    console.log('   2. Acesse: https://supabase.com/dashboard');
    console.log('   3. Projeto: supabase-fuchsia-dog → SQL Editor');
    console.log('   4. Copie e execute o conteúdo de: supabase/schema.sql\n');
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  }
}

testSupabase();
