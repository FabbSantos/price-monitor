'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceCard } from '@/components/PriceCard';
import { PriceHistory } from '@/components/PriceHistory';
import { PriceData, PriceHistory as PriceHistoryType } from '@/lib/types';
import productsConfig from '../../config/products.json';
import { RefreshCw, Clock, Zap, TrendingDown } from 'lucide-react';

const CHECK_INTERVAL = parseInt(process.env.NEXT_PUBLIC_CHECK_INTERVAL || '15') * 60 * 1000; // 15 min default

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [history, setHistory] = useState<PriceHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isManualUpdate, setIsManualUpdate] = useState(false);

  // Carrega preços do banco (NUNCA faz scraping)
  // Apenas o CRON externo faz scraping chamando /api/scrape
  const fetchPrices = useCallback(async (manual = false) => {
    if (manual) {
      console.log('[Frontend] 🔄 Atualização MANUAL (busca banco)');
      setIsManualUpdate(true);
    } else {
      console.log('[Frontend] 🔄 Polling automático');
    }

    setLoading(true);
    try {
      // SEMPRE busca do banco - nunca faz scraping no frontend
      const endpoint = '/api/prices';
      console.log('[Frontend] Chamando:', endpoint);
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setPrices(data.prices);

        // LOG DO VALOR RAW da API
        console.log('[Frontend] 📥 lastCheck RAW da API:', data.lastCheck);

        // Usa lastCheck do banco se disponível
        const lastCheckTime = data.lastCheck ? new Date(data.lastCheck) : new Date();
        console.log('[Frontend] 🕐 lastCheck convertido (local):', lastCheckTime.toLocaleString('pt-BR'));
        console.log('[Frontend] 🕐 lastCheck ISO:', lastCheckTime.toISOString());
        console.log('[Frontend] 🕐 lastCheck timestamp (ms):', lastCheckTime.getTime());

        // ⚠️ IMPORTANTE: Só atualiza estado se o timestamp REALMENTE MUDOU
        // Isso previne reset do countdown quando recebe dados duplicados
        setLastUpdate(prevLastUpdate => {
          const prevTime = prevLastUpdate?.getTime() || 0;
          const newTime = lastCheckTime.getTime();

          if (prevTime !== newTime) {
            console.log('[Frontend] ✅ lastCheck MUDOU! De', prevLastUpdate?.toLocaleString('pt-BR'), 'para', lastCheckTime.toLocaleString('pt-BR'));
            return lastCheckTime;
          } else {
            console.log('[Frontend] ℹ️  lastCheck NÃO MUDOU (ainda é', lastCheckTime.toLocaleString('pt-BR'), ')');
            return prevLastUpdate; // Retorna o mesmo objeto para evitar re-render
          }
        });

        // Calcula próxima atualização baseado no lastCheck do banco
        const nextCheckTime = new Date(lastCheckTime.getTime() + CHECK_INTERVAL);
        console.log('[Frontend] ⏭️  Próxima atualização calculada:', nextCheckTime.toLocaleString('pt-BR'));

        setNextUpdate(prevNextUpdate => {
          const prevTime = prevNextUpdate?.getTime() || 0;
          const newTime = nextCheckTime.getTime();

          if (prevTime !== newTime) {
            console.log('[Frontend] ✅ nextUpdate MUDOU!');
            return nextCheckTime;
          } else {
            console.log('[Frontend] ℹ️  nextUpdate NÃO MUDOU');
            return prevNextUpdate; // Retorna o mesmo objeto para evitar reset do countdown
          }
        });

        // Histórico já vem junto na API
        if (data.history) {
          // Converte do formato do banco para o formato esperado
          const historyArray: PriceHistoryType[] = Object.entries(data.history).map(([key, entries]) => {
            // Separa no ÚLTIMO hífen para pegar productId-store corretamente
            // Ex: "tcl-c755-65-magazineluiza" -> productId="tcl-c755-65", store="magazineluiza"
            const lastDashIndex = key.lastIndexOf('-');
            const productId = key.substring(0, lastDashIndex);
            const store = key.substring(lastDashIndex + 1);

            return {
              productId,
              store,
              prices: (entries as Array<{ date: string; price: number }>).map(entry => ({
                price: entry.price,
                timestamp: entry.date,
              })),
            };
          });
          setHistory(historyArray);
          console.log('[Frontend] Histórico carregado:', historyArray.length, 'entradas');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
    } finally {
      setLoading(false);
      if (manual) {
        setIsManualUpdate(false);
      }
    }
  }, []);

  // Atualização automática via polling
  useEffect(() => {
    // Carrega dados iniciais do banco
    fetchPrices(false);

    // Polling a cada 30s para ver se o cron atualizou o banco
    const pollingInterval = setInterval(() => {
      fetchPrices(false);
    }, 30000); // 30 segundos

    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchPrices]);

  // Countdown para próxima atualização
  useEffect(() => {
    if (!nextUpdate) return;

    console.log('[Frontend] 🎬 useEffect countdown iniciado. nextUpdate:', nextUpdate.toLocaleString('pt-BR'));

    // Flag para evitar múltiplas chamadas quando countdown zera
    let hasTriggeredFetch = false;

    const interval = setInterval(() => {
      const now = Date.now();
      const target = nextUpdate.getTime();
      const remaining = target - now;

      // Atualiza o countdown (sempre positivo na UI)
      setCountdown(Math.max(0, remaining));

      // Log detalhado a cada minuto ou quando estiver perto de zerar
      const shouldLog = remaining <= 10000 || (remaining % 60000 < 1000);
      if (shouldLog) {
        console.log('[Frontend] ⏱️  Countdown:', Math.floor(remaining / 1000), 's restantes');
      }

      // Quando o contador zerar, busca novos dados (apenas UMA VEZ)
      if (remaining <= 0 && !hasTriggeredFetch) {
        console.log('[Frontend] ⏰ Contador ZEROU! Tempo esperado passou. Buscando novos dados...');
        hasTriggeredFetch = true; // Previne múltiplas chamadas
        fetchPrices(false);
      }

      // Se passou MUITO tempo (>2min) do esperado, alerta
      if (remaining < -120000 && !hasTriggeredFetch) {
        console.warn('[Frontend] ⚠️  Cron está ATRASADO! Já passou', Math.abs(Math.floor(remaining / 1000)), 's do esperado');
        hasTriggeredFetch = true;
        fetchPrices(false);
      }
    }, 1000);

    return () => {
      console.log('[Frontend] 🛑 useEffect countdown limpando interval');
      clearInterval(interval);
    };
  }, [nextUpdate, fetchPrices]);

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
                  Nenhum preço disponível ainda. Clique em &quot;Atualizar&quot; para buscar.
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
        </footer>
      </div>
    </div>
  );
}
