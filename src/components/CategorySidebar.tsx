'use client';

import { Grid, Monitor, Tv } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  productCounts: Record<string, number>;
}

const iconMap: Record<string, any> = {
  grid: Grid,
  monitor: Monitor,
  tv: Tv,
};

export function CategorySidebar({
  categories,
  activeCategory,
  onCategoryChange,
  productCounts
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="glass rounded-xl p-4 sticky top-4 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 px-2">
          Categorias
        </h3>
        <nav className="space-y-2">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Grid;
            const isActive = activeCategory === category.id;
            const count = productCounts[category.id] || 0;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
