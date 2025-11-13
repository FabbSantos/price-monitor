'use client';

import { PriceData } from '@/lib/types';
import { ExternalLink, TrendingDown, TrendingUp, AlertCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PriceCardProps {
  priceData: PriceData;
  targetPrice: number;
}

export function PriceCard({ priceData, targetPrice }: PriceCardProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isTargetReached = priceData.price !== null && priceData.price <= targetPrice;
  const priceChange = priceData.price ? ((priceData.price - targetPrice) / targetPrice) * 100 : 0;

  useEffect(() => {
    if (isTargetReached) {
      setShouldAnimate(true);
    }
  }, [isTargetReached]);

  return (
    <div
      className={`glass rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
        shouldAnimate ? 'animate-price-alert border-2 border-green-500' : ''
      }`}
    >
      {/* Header da loja */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{priceData.storeName}</h3>
        {isTargetReached && (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse">
            <Check size={16} />
            ALVO!
          </div>
        )}
      </div>

      {/* Preço */}
      <div className="mb-4">
        {priceData.price !== null ? (
          <div className="space-y-2">
            <div className="text-4xl font-bold text-white">
              R$ {priceData.price.toFixed(2).replace('.', ',')}
            </div>
            <div className="flex items-center gap-2">
              {priceChange < 0 ? (
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingDown size={16} />
                  <span className="ml-1">{Math.abs(priceChange).toFixed(1)}% abaixo do alvo</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400 text-sm">
                  <TrendingUp size={16} />
                  <span className="ml-1">{priceChange.toFixed(1)}% acima do alvo</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Preço não disponível</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Preço alvo:</span>
          <span className="text-white font-semibold">
            R$ {targetPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status:</span>
          <span
            className={`font-semibold ${
              priceData.available ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {priceData.available ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
      </div>

      {/* Erro */}
      {priceData.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{priceData.error}</p>
        </div>
      )}

      {/* Botão */}
      <a
        href={priceData.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          isTargetReached
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {isTargetReached ? 'COMPRAR AGORA' : 'Ver produto'}
        <ExternalLink size={16} />
      </a>

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Atualizado: {new Date(priceData.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
