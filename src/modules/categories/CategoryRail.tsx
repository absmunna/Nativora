import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { SafeImage } from '@/components/shared/SafeImage';

interface CategoryRailProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryRail({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeCategories = categories.filter((c) => c.isActive);

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#164A31]/10 text-[#164A31] text-[11px] font-semibold tracking-wide uppercase">
          <Sparkles className="w-3 h-3 text-[#D97706]" />
          <span>Pure Pantry</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#14241C]">
          Featured Categories
        </h2>
        <p className="text-xs text-[#4F6156] max-w-sm mx-auto">
          Explore cold-pressed oils, raw honey, spices, and organic grains.
        </p>
      </div>

      <div className="relative flex items-center group">
        <button
          type="button"
          onClick={() => scrollBy(-240)}
          aria-label="Scroll categories left"
          className="hidden sm:flex absolute -left-3 z-10 w-9 h-9 rounded-full bg-[#164A31] hover:bg-[#103825] text-white items-center justify-center shadow-lg border border-white/20 cursor-pointer transition-transform hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="w-full flex items-start justify-start sm:justify-center gap-3 sm:gap-5 overflow-x-auto px-2 sm:px-10 py-2.5 no-scrollbar"
        >
          {/* All Products Tile */}
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group/tile"
          >
            <div
              className={`w-22 h-22 sm:w-28 sm:h-28 rounded-2xl p-2.5 flex items-center justify-center transition-all duration-300 ${
                selectedCategoryId === 'all'
                  ? 'bg-gradient-to-br from-[#164A31] to-[#103825] text-white shadow-md ring-4 ring-[#164A31]/15 scale-[1.02]'
                  : 'bg-[#FFF6F9] border border-[#E5D5DA] shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)] group-hover/tile:border-[#164A31]/40 group-hover/tile:shadow-md group-hover/tile:-translate-y-0.5'
              }`}
            >
              <div className="w-full h-full rounded-xl bg-white/90 p-1.5 flex items-center justify-center overflow-hidden">
                <SafeImage
                  src="/images/logo/nativora-logo.webp"
                  alt="All Nativora Products"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover/tile:scale-110"
                />
              </div>
            </div>
            <span
              className={`text-xs sm:text-sm font-semibold text-center transition-colors ${
                selectedCategoryId === 'all' ? 'text-[#164A31] font-bold' : 'text-[#14241C] group-hover/tile:text-[#164A31]'
              }`}
            >
              All Products
            </span>
          </button>

          {activeCategories.map((cat) => {
            const active = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group/tile"
              >
                <div
                  className={`w-22 h-22 sm:w-28 sm:h-28 rounded-2xl p-2.5 flex items-center justify-center transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-br from-[#164A31] to-[#103825] text-white shadow-md ring-4 ring-[#164A31]/15 scale-[1.02]'
                      : 'bg-[#FFF6F9] border border-[#E5D5DA] shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)] group-hover/tile:border-[#164A31]/40 group-hover/tile:shadow-md group-hover/tile:-translate-y-0.5'
                  }`}
                >
                  <div className="w-full h-full rounded-xl bg-white/90 p-1.5 flex items-center justify-center overflow-hidden">
                    <SafeImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover/tile:scale-110"
                    />
                  </div>
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold text-center max-w-[110px] leading-tight transition-colors ${
                    active ? 'text-[#164A31] font-bold' : 'text-[#14241C] group-hover/tile:text-[#164A31]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(240)}
          aria-label="Scroll categories right"
          className="hidden sm:flex absolute -right-3 z-10 w-9 h-9 rounded-full bg-[#164A31] hover:bg-[#103825] text-white items-center justify-center shadow-lg border border-white/20 cursor-pointer transition-transform hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
