'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceCard } from '@/components/PriceCard';
import { PriceHistory } from '@/components/PriceHistory';
import { PriceData, PriceHistory as PriceHistoryType } from '@/lib/types';
import productsConfig from '../../config/products.json';
import { RefreshCw, Clock, Zap, TrendingDown } from 'lucide-react';

const CHECK_INTERVAL = parseInt(process.env.NEXT_PUBLIC_CHECK_INTERVAL || '30') * 60 * 1000; // 30 min default

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [history, setHistory] = useState<PriceHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Carrega preços
  const fetchPrices = useCallback(async (manual = false) => {
    setLoading(true);
    try {
      // Se manual, faz scraping. Se não, apenas carrega os dados salvos
      const endpoint = manual ? '/api/scrape' : '/api/prices';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setPrices(data.prices);
        setLastUpdate(new Date());
        setNextUpdate(new Date(Date.now() + CHECK_INTERVAL));
      }
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega histórico
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  }, []);

  // Atualização automática
  useEffect(() => {
    // Carrega dados iniciais (sem fazer scraping)
    fetchPrices(false);
    fetchHistory();

    // Configura intervalo para scraping automático
    const interval = setInterval(() => {
      fetchPrices(true);
      fetchHistory();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchPrices, fetchHistory]);

  // Countdown para próxima atualização
  useEffect(() => {
    if (!nextUpdate) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, nextUpdate.getTime() - Date.now());
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextUpdate]);

  // Formata countdown
  const formatCountdown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Agrupa preços por produto
  const groupedPrices = productsConfig.products.map((product) => ({
    product,
    prices: prices.filter((p) => p.productId === product.id),
  }));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Monitor de Preços
              </h1>
              <p className="text-gray-400 mt-2">Black Friday 2025 - TVs TCL</p>
            </div>
            <button
              onClick={() => fetchPrices(true)}
              disabled={loading}
              className="glass px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Status bar */}
          <div className="glass rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="text-purple-400" size={24} />
              <div>
                <div className="text-sm text-gray-400">Última atualização</div>
                <div className="font-semibold">
                  {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Nunca'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-400" size={24} />
              <div>
                <div className="text-sm text-gray-400">Próxima em</div>
                <div className="font-semibold">{formatCountdown(countdown)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingDown className="text-green-400" size={24} />
              <div>
                <div className="text-sm text-gray-400">Produtos monitorados</div>
                <div className="font-semibold">{productsConfig.products.length}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Produtos */}
        {groupedPrices.map(({ product, prices: productPrices }) => (
          <div key={product.id} className="mb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
              <p className="text-gray-400">
                Alerta configurado para R$ {product.targetPrice.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Grid de preços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {productPrices.length > 0 ? (
                productPrices.map((price) => (
                  <PriceCard
                    key={`${price.productId}-${price.store}`}
                    priceData={price}
                    targetPrice={product.targetPrice}
                  />
                ))
              ) : (
                <div className="col-span-full glass rounded-xl p-8 text-center text-gray-400">
                  Nenhum preço disponível ainda. Clique em "Atualizar" para buscar.
                </div>
              )}
            </div>

            {/* Histórico */}
            <PriceHistory history={history} productId={product.id} />
          </div>
        ))}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>Monitoramento automático a cada {CHECK_INTERVAL / 60000} minutos</p>
          <p className="mt-2">Desenvolvido com Next.js, TypeScript e Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
