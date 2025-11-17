'use client';

import { Tag, TrendingDown, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  targetPrice: number;
}

interface ProductCatalogCardProps {
  product: Product;
  lowestPrice: number | null;
  isTargetReached: boolean;
  onClick: () => void;
}

export function ProductCatalogCard({
  product,
  lowestPrice,
  isTargetReached,
  onClick
}: ProductCatalogCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative group glass rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        isTargetReached ? 'ring-2 ring-green-500 animate-pulse' : ''
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-emerald-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-emerald-500/5 transition-all duration-500 pointer-events-none" />

      {/* Layout horizontal */}
      <div className="relative flex gap-3 p-3 z-10">
        {/* Imagem */}
        <div className="relative w-20 h-20 bg-white/5 rounded-lg flex-shrink-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AlertCircle size={24} className="text-gray-600" />
            </div>
          )}

          {/* Badge de alvo atingido */}
          {isTargetReached && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
              <Tag size={10} />
              ALVO
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-1">
              {product.description}
            </p>
          </div>

          {/* Preços em linha */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-gray-500">Melhor preço</div>
              {lowestPrice !== null ? (
                <div className="text-xl font-bold text-white">
                  R$ {lowestPrice.toFixed(2).replace('.', ',')}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Indisponível</div>
              )}
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div>
              <div className="text-[10px] text-gray-500">Alvo</div>
              <div className="text-sm font-semibold text-purple-400">
                R$ {product.targetPrice.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Indicador de economia */}
            {lowestPrice !== null && lowestPrice <= product.targetPrice && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingDown size={14} />
                  <div>
                    <div className="text-[10px] text-gray-500">Economia</div>
                    <div className="text-sm font-semibold">
                      {((1 - lowestPrice / product.targetPrice) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <button className="px-4 py-1.5 rounded-lg font-medium transition-all bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 hover:border-white/20 whitespace-nowrap">
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
