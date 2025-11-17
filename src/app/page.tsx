'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductCatalogCard } from '@/components/ProductCatalogCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CategorySidebar } from '@/components/CategorySidebar';
import { PriceData, PriceHistory as PriceHistoryType } from '@/lib/types';
import productsConfig from '../../config/products.json';
import { Clock, Zap, TrendingDown } from 'lucide-react';

const CHECK_INTERVAL = parseInt(process.env.NEXT_PUBLIC_CHECK_INTERVAL || '120') * 60 * 1000; // 2 horas default

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [history, setHistory] = useState<PriceHistoryType[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Estado do catálogo
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Carrega preços do banco (NUNCA faz scraping)
  // Apenas o CRON externo faz scraping chamando /api/scrape
  const fetchPrices = useCallback(async () => {
    console.log('[Frontend] 🔄 Polling automático');

    try {
      // SEMPRE busca do banco - nunca faz scraping no frontend
      const endpoint = '/api/prices';
      console.log('[Frontend] Chamando:', endpoint);
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
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
    }
  }, []);

  // Atualização automática via polling
  useEffect(() => {
    // Carrega dados iniciais do banco
    fetchPrices();

    // Polling a cada 30s para ver se o cron atualizou o banco
    const pollingInterval = setInterval(() => {
      fetchPrices();
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

      // Quando o contador zerar, busca novos dados (apenas UMA VEZ)
      if (remaining <= 0 && !hasTriggeredFetch) {
        console.log('[Frontend] ⏰ Contador ZEROU! Buscando novos dados...');
        hasTriggeredFetch = true;
        fetchPrices();
      }

      // Se passou MUITO tempo (>2min) do esperado, alerta
      if (remaining < -120000 && !hasTriggeredFetch) {
        console.warn('[Frontend] ⚠️  Cron ATRASADO >2min! Buscando...');
        hasTriggeredFetch = true;
        fetchPrices();
      }
    }, 1000);

    return () => {
      console.log('[Frontend] 🛑 useEffect countdown limpando interval');
      clearInterval(interval);
    };
  }, [nextUpdate, fetchPrices]);

  // Formata countdown
  const formatCountdown = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filtra produtos por categoria
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return productsConfig.products;
    }
    return productsConfig.products.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  // Calcula contadores de produtos por categoria
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: productsConfig.products.length,
    };

    productsConfig.categories?.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = productsConfig.products.filter(p => p.category === cat.id).length;
      }
    });

    return counts;
  }, []);

  // Pega produto selecionado
  const selectedProductData = useMemo(() => {
    if (!selectedProduct) return null;
    return productsConfig.products.find(p => p.id === selectedProduct);
  }, [selectedProduct]);

  // Pega preços do produto selecionado
  const selectedProductPrices = useMemo(() => {
    if (!selectedProduct) return [];
    return prices.filter(p => p.productId === selectedProduct);
  }, [selectedProduct, prices]);

  // Pega histórico do produto selecionado
  const selectedProductHistory = useMemo(() => {
    if (!selectedProduct) return [];
    return history.filter(h => h.productId === selectedProduct);
  }, [selectedProduct, history]);

  // Calcula menor preço por produto
  const getLowestPrice = (productId: string): number | null => {
    const productPrices = prices.filter(p => p.productId === productId && p.price !== null);
    if (productPrices.length === 0) return null;
    return Math.min(...productPrices.map(p => p.price!));
  };

  // Verifica se o alvo foi atingido
  const isTargetReached = (productId: string): boolean => {
    const lowestPrice = getLowestPrice(productId);
    if (lowestPrice === null) return false;
    const product = productsConfig.products.find(p => p.id === productId);
    return lowestPrice <= (product?.targetPrice || 0);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Blobs decorativos */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6">
            <div className="relative">
              <h1 className="text-3xl md:text-5xl font-bold text-white relative inline-block">
                Monitor de Preços
                {/* Subtle glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-2xl -z-10" />
              </h1>
              <p className="text-gray-400 mt-2 text-sm md:text-base">Acompanhe os melhores preços em tempo real</p>
            </div>
          </div>

          {/* Status bar */}
          <div className="glass rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border border-white/5">
            <div className="flex items-center md:justify-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="text-blue-400" size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Última atualização</div>
                <div className="font-semibold text-white">
                  {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Nunca'}
                </div>
              </div>
            </div>
            <div className="flex items-center md:justify-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Zap className="text-amber-400" size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Próxima em</div>
                <div className="font-semibold text-white">{formatCountdown(countdown)}</div>
              </div>
            </div>
            <div className="flex items-center md:justify-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingDown className="text-emerald-400" size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Produtos monitorados</div>
                <div className="font-semibold text-white">{productsConfig.products.length}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Layout principal: Sidebar + Catálogo */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de categorias */}
          <CategorySidebar
            categories={productsConfig.categories || []}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            productCounts={productCounts}
          />

          {/* Grid de produtos */}
          <main className="flex-1">
            <div className="flex flex-col gap-4">
              {filteredProducts.map(product => (
                <ProductCatalogCard
                  key={product.id}
                  product={product}
                  lowestPrice={getLowestPrice(product.id)}
                  isTargetReached={isTargetReached(product.id)}
                  onClick={() => setSelectedProduct(product.id)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="glass rounded-xl p-12 text-center text-gray-400">
                Nenhum produto encontrado nesta categoria.
              </div>
            )}
          </main>
        </div>

        {/* Modal de detalhes do produto */}
        {selectedProductData && (
          <ProductDetailModal
            product={selectedProductData}
            prices={selectedProductPrices}
            history={selectedProductHistory}
            isOpen={selectedProduct !== null}
            onClose={() => setSelectedProduct(null)}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>Desenvolvido por Fabrício Bahiense</p>
        </footer>
      </div>
    </div>
  );
}
