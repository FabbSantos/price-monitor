import { NextResponse } from 'next/server';
import { loadLatestPrices } from '@/lib/storage';

/**
 * API Route para obter os preços mais recentes
 * GET /api/prices
 */
export async function GET() {
  try {
    const prices = loadLatestPrices();

    return NextResponse.json({
      success: true,
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao carregar preços:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
