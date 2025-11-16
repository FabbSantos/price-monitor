import { NextRequest, NextResponse } from 'next/server';
import { loadHistory, getProductHistory } from '@/lib/storage';

// Força a rota a ser dinâmica (não cacheada) - CRITICAL para Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route para obter histórico de preços
 * GET /api/history?productId=xxx&store=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const store = searchParams.get('store');

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (productId && store) {
      // Retorna histórico específico de um produto em uma loja
      const history = getProductHistory(productId, store);

      return NextResponse.json({
        success: true,
        history,
      }, { headers });
    }

    // Retorna todo o histórico
    const history = loadHistory();

    return NextResponse.json({
      success: true,
      history,
    }, { headers });
  } catch (error) {
    console.error('[API] Erro ao carregar histórico:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
