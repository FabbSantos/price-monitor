import { NextRequest, NextResponse } from 'next/server';
import { loadHistory, getProductHistory } from '@/lib/storage';

/**
 * API Route para obter histórico de preços
 * GET /api/history?productId=xxx&store=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const store = searchParams.get('store');

    if (productId && store) {
      // Retorna histórico específico de um produto em uma loja
      const history = getProductHistory(productId, store);

      return NextResponse.json({
        success: true,
        history,
      });
    }

    // Retorna todo o histórico
    const history = loadHistory();

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('[API] Erro ao carregar histórico:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
