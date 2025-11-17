'use client';

import { X } from 'lucide-react';
import { PriceCard } from './PriceCard';
import { PriceHistory } from './PriceHistory';
import { PriceData, PriceHistory as PriceHistoryType } from '@/lib/types';
import Image from 'next/image';
import { useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  targetPrice: number;
}

interface ProductDetailModalProps {
  product: Product;
  prices: PriceData[];
  history: PriceHistoryType[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  prices,
  history,
  isOpen,
  onClose
}: ProductDetailModalProps) {
  // Fecha o modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Previne scroll do body
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky flex flex-col md:flex-row top-0 z-10 bg-gray-900 border-b border-white/10 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Imagem do produto */}
            {product.image && (
              <div className="relative w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-1 md:p-2"
                />
              </div>
            )}

            {/* Info do produto */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white mb-1 line-clamp-1">
                {product.name}
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs md:text-sm">
                <p className="text-gray-400 line-clamp-1">{product.description}</p>
                <span className="text-gray-600 hidden md:inline">•</span>
                <p className="text-gray-500">
                  Alerta:{' '}
                  <span className="text-purple-400 font-semibold">
                    R$ {product.targetPrice.toFixed(2).replace('.', ',')}
                  </span>
                </p>
              </div>
            </div>

            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">

        {/* Conteúdo */}
        <div className="p-6">
          {/* Grid de preços */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Preços nas lojas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prices.length > 0 ? (
                prices.map((price) => (
                  <PriceCard
                    key={`${price.productId}-${price.store}`}
                    priceData={price}
                    targetPrice={product.targetPrice}
                  />
                ))
              ) : (
                <div className="col-span-full glass rounded-xl p-8 text-center text-gray-400">
                  Nenhum preço disponível ainda.
                </div>
              )}
            </div>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Histórico de preços
            </h3>
            <PriceHistory history={history} productId={product.id} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
