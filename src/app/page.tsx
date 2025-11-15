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

  // Ref para pausar polling sem re-criar o intervalo
  const skipPollingRef = useRef(false);

  // Carrega preços
  const fetchPrices = useCallback(async (manual = false) => {
    // Se é manual, marca flag para pausar polling temporariamente
    if (manual) {
      setIsManualUpdate(true);
      skipPollingRef.current = true;
    }

    setLoading(true);
    try {
      // Se manual, faz scraping. Se não, apenas carrega os dados salvos
      const endpoint = manual ? '/api/scrape' : '/api/prices';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setPrices(data.prices);

        // Usa lastCheck do banco se disponível
        const lastCheckTime = data.lastCheck ? new Date(data.lastCheck) : new Date();
        setLastUpdate(lastCheckTime);

        // Calcula próxima atualização baseado no lastCheck do banco
        const nextCheckTime = new Date(lastCheckTime.getTime() + CHECK_INTERVAL);
        setNextUpdate(nextCheckTime);

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

      // Após atualização manual, aguarda 5s antes de voltar ao polling
      if (manual) {
        setTimeout(() => {
          setIsManualUpdate(false);
          skipPollingRef.current = false;
        }, 5000);
      }
    }
  }, []);

  // Atualização automática
  useEffect(() => {
    // Carrega dados iniciais (sem fazer scraping)
    fetchPrices(false);

    // Polling a cada 30s para ver se há novos dados (quando o cron rodar)
    const pollingInterval = setInterval(() => {
      // Só faz polling se NÃO estiver em atualização manual
      // Usa ref para evitar recriar o intervalo quando o estado muda
      if (!skipPollingRef.current) {
        fetchPrices(false); // Busca do banco sem scraping
      }
    }, 30000); // 30 segundos

    // Scraping manual apenas quando o usuário clica (cron faz o resto)
    // Removido o intervalo automático de scraping no frontend

    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchPrices]); // Removido isManualUpdate das dependências

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
