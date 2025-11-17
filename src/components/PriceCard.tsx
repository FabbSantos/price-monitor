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
      className={`glass rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full flex flex-col ${
        shouldAnimate ? 'animate-price-alert border-2 border-green-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">{priceData.storeName}</h3>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full ${
            priceData.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {priceData.available ? 'Disponível' : 'Indisponível'}
        </span>
      </div>

      {/* Badge alvo - altura fixa */}
      <div className="h-8 mb-3">
        {isTargetReached && (
          <div className="inline-flex bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold items-center gap-1 animate-pulse">
            <Check size={12} />
            ALVO ATINGIDO
          </div>
        )}
      </div>

      {/* Preço principal - altura fixa */}
      <div className="h-[60px] mb-3">
        {priceData.price !== null ? (
          <>
            <div className="text-3xl font-bold text-white mb-1">
              R$ {priceData.price.toFixed(2).replace('.', ',')}
            </div>
            <div className="flex items-center gap-1">
              {priceChange < 0 ? (
                <div className="flex items-center text-emerald-400 text-xs">
                  <TrendingDown size={14} />
                  <span className="ml-1">{Math.abs(priceChange).toFixed(1)}% abaixo do alvo</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400 text-xs">
                  <TrendingUp size={14} />
                  <span className="ml-1">{priceChange.toFixed(1)}% acima do alvo</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-400 flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="text-sm">Preço indisponível</span>
          </div>
        )}
      </div>

      {/* Info secundária */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div>
          <div className="text-[10px] text-gray-500">Preço alvo</div>
          <div className="text-sm font-semibold text-purple-400">
            R$ {targetPrice.toFixed(2).replace('.', ',')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500">Atualizado</div>
          <div className="text-[10px] text-gray-400">
            {new Date(priceData.timestamp).toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Botão - empurrado para o final */}
      <a
        href={priceData.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all mt-auto ${
          isTargetReached
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {isTargetReached ? 'COMPRAR AGORA' : 'Ver na Loja'}
        <ExternalLink size={16} />
      </a>
    </div>
  );
}
