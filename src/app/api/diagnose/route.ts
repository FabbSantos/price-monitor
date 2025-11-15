import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Endpoint de diagnóstico para identificar problemas de persistência no Supabase
 * GET /api/diagnose
 */
export async function GET(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('[DIAGNOSE] 🔍 Iniciando diagnóstico do Supabase');
  console.log('[DIAGNOSE] Timestamp:', new Date().toISOString());
  console.log('='.repeat(80));

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    const supabase = getSupabaseAdmin();

    // TEST 1: Verificar credenciais
    console.log('\n[TEST 1] Verificando credenciais...');
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    results.tests.push({
      name: 'Credenciais',
      passed: hasUrl && hasServiceKey,
      details: {
        hasUrl,
        hasServiceKey,
        url: hasUrl ? process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' : 'MISSING',
      },
    });

    console.log('[TEST 1] URL presente:', hasUrl);
    console.log('[TEST 1] Service Key presente:', hasServiceKey);

    // TEST 2: Ler dados existentes de price_checks
    console.log('\n[TEST 2] Tentando LER price_checks...');
    const { data: readData, error: readError } = await supabase
      .from('price_checks')
      .select('*')
      .eq('id', 1)
      .single();

    results.tests.push({
      name: 'Leitura de price_checks',
      passed: !readError,
      error: readError,
      data: readData,
    });

    if (readError) {
      console.error('[TEST 2] ❌ Erro ao ler:', readError);
    } else {
      console.log('[TEST 2] ✅ Leitura bem-sucedida');
      console.log('[TEST 2] Dados:', JSON.stringify(readData, null, 2));
    }

    // TEST 3: Tentar ATUALIZAR price_checks
    console.log('\n[TEST 3] Tentando ATUALIZAR price_checks...');
    const testTimestamp = new Date().toISOString();

    const { data: updateData, error: updateError } = await supabase
      .from('price_checks')
      .update({ last_check: testTimestamp })
      .eq('id', 1)
      .select();

    results.tests.push({
      name: 'Atualização de price_checks',
      passed: !updateError,
      error: updateError,
      requestedTimestamp: testTimestamp,
      returnedData: updateData,
      rowsAffected: updateData?.length || 0,
    });

    if (updateError) {
      console.error('[TEST 3] ❌ Erro ao atualizar:', updateError);
    } else {
      console.log('[TEST 3] ✅ Update retornou sucesso');
      console.log('[TEST 3] Timestamp solicitado:', testTimestamp);
      console.log('[TEST 3] Dados retornados:', JSON.stringify(updateData, null, 2));
      console.log('[TEST 3] Linhas afetadas:', updateData?.length || 0);
    }

    // TEST 4: Criar NOVO cliente e LER de volta (verificar se persistiu)
    console.log('\n[TEST 4] Criando NOVO cliente e lendo de volta...');
    const supabase2 = getSupabaseAdmin();

    const { data: verifyData, error: verifyError } = await supabase2
      .from('price_checks')
      .select('*')
      .eq('id', 1)
      .single();

    const isPersisted = verifyData?.last_check === testTimestamp;

    results.tests.push({
      name: 'Verificação de persistência',
      passed: isPersisted,
      error: verifyError,
      expectedTimestamp: testTimestamp,
      actualTimestamp: verifyData?.last_check,
      matches: isPersisted,
      data: verifyData,
    });

    if (verifyError) {
      console.error('[TEST 4] ❌ Erro ao verificar:', verifyError);
    } else {
      console.log('[TEST 4] Timestamp esperado:', testTimestamp);
      console.log('[TEST 4] Timestamp lido:', verifyData?.last_check);
      console.log('[TEST 4] Match:', isPersisted ? '✅ SIM - PERSISTIU!' : '❌ NÃO - NÃO PERSISTIU!');
    }

    // TEST 5: Tentar INSERT em current_prices
    console.log('\n[TEST 5] Tentando INSERT em current_prices...');
    const testPrice = {
      product_id: 'test-diagnostic',
      store: 'test-store',
      price: 9999.99,
      available: true,
      error: null,
      checked_at: testTimestamp,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('current_prices')
      .upsert(testPrice, { onConflict: 'product_id,store' })
      .select();

    results.tests.push({
      name: 'Insert/Upsert em current_prices',
      passed: !insertError,
      error: insertError,
      testData: testPrice,
      returnedData: insertData,
    });

    if (insertError) {
      console.error('[TEST 5] ❌ Erro ao inserir:', insertError);
    } else {
      console.log('[TEST 5] ✅ Insert retornou sucesso');
      console.log('[TEST 5] Dados retornados:', JSON.stringify(insertData, null, 2));
    }

    // TEST 6: Verificar se o insert persistiu
    console.log('\n[TEST 6] Verificando se insert persistiu...');
    const supabase3 = getSupabaseAdmin();

    const { data: verifyInsert, error: verifyInsertError } = await supabase3
      .from('current_prices')
      .select('*')
      .eq('product_id', 'test-diagnostic')
      .eq('store', 'test-store')
      .single();

    const insertPersisted = !!verifyInsert && verifyInsert.price === 9999.99;

    results.tests.push({
      name: 'Verificação de persistência do insert',
      passed: insertPersisted,
      error: verifyInsertError,
      found: !!verifyInsert,
      data: verifyInsert,
    });

    if (verifyInsertError) {
      console.error('[TEST 6] ❌ Erro ao verificar insert:', verifyInsertError);
    } else {
      console.log('[TEST 6] Insert encontrado:', insertPersisted ? '✅ SIM' : '❌ NÃO');
      console.log('[TEST 6] Dados:', JSON.stringify(verifyInsert, null, 2));
    }

    // TEST 7: Limpar dados de teste
    console.log('\n[TEST 7] Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('current_prices')
      .delete()
      .eq('product_id', 'test-diagnostic')
      .eq('store', 'test-store');

    if (deleteError) {
      console.error('[TEST 7] ⚠️  Erro ao limpar:', deleteError);
    } else {
      console.log('[TEST 7] ✅ Dados de teste removidos');
    }

    // RESUMO
    const allPassed = results.tests.every((t: any) => t.passed);
    results.summary = {
      totalTests: results.tests.length,
      passed: results.tests.filter((t: any) => t.passed).length,
      failed: results.tests.filter((t: any) => !t.passed).length,
      allPassed,
    };

    console.log('\n' + '='.repeat(80));
    console.log('[DIAGNOSE] 📊 RESUMO:');
    console.log('[DIAGNOSE] Testes executados:', results.summary.totalTests);
    console.log('[DIAGNOSE] Passaram:', results.summary.passed);
    console.log('[DIAGNOSE] Falharam:', results.summary.failed);
    console.log('[DIAGNOSE] Status geral:', allPassed ? '✅ TODOS PASSARAM' : '❌ ALGUNS FALHARAM');
    console.log('='.repeat(80));

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('[DIAGNOSE] ❌ Erro geral:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
