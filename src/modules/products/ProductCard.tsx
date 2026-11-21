import { useState } from 'react';
import { ShoppingCart, Check, Flame, Heart } from 'lucide-react';
import { Product } from '@/types';
import { formatBDT } from '@/utils/format';
import { SafeImage } from '@/components/shared/SafeImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenLanding: (slug: string) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onOpenLanding,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    if (product.stock <= 0) return;
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  return (
    <article className="group relative bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)] transition-all duration-200 hover:border-[#164A31]/45 hover:shadow-[0_12px_28px_-10px_rgba(22,74,49,0.14)] hover:-translate-y-0.5">
      {/* Top-right Best Selling tag */}
      {product.featured && (
        <div className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 px-2.5 py-1 bg-[#D97706] text-white text-[10px] sm:text-xs font-semibold rounded-bl-xl shadow-xs">
          <Flame className="w-3 h-3 fill-white" />
          <span>Best Selling</span>
        </div>
      )}

      {/* Subtle Wishlist toggle top-left */}
      <button
        type="button"
        onClick={() => onToggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
        className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-[#FFF6F9]/95 border border-[#E5D5DA] shadow-xs flex items-center justify-center cursor-pointer hover:border-[#164A31]"
      >
        <Heart
          className={`w-3.5 h-3.5 ${
            isWishlisted ? 'fill-[#D97706] text-[#D97706]' : 'text-[#4F6156]'
          }`}
        />
      </button>

      {/* Uncropped square product image with subtle surface separation */}
      <button
        type="button"
        onClick={() => onOpenLanding(product.slug)}
        className="block w-full aspect-square bg-[#FFF2F5] border-b border-[#F0E2E7] p-2.5 sm:p-3 cursor-pointer"
        aria-label={`Open ${product.name}`}
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fallbackTitle={product.name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      {/* Card Body */}
      <div className="px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4 flex-1 flex flex-col">
        <h3 className="font-sans text-xs sm:text-sm font-semibold text-[#14241C] leading-snug line-clamp-2 min-h-[2.3rem] mb-1">
          <button
            type="button"
            onClick={() => onOpenLanding(product.slug)}
            className="text-left hover:text-[#164A31] transition-colors cursor-pointer"
          >
            {product.name}
          </button>
        </h3>

        <p className="text-[11px] text-[#4F6156] truncate mb-2">{product.unitLabel}</p>

        {/* Price + Strikethrough + Save badge row */}
        <div className="flex flex-wrap items-center gap-1.5 tabular-nums mb-3 mt-auto">
          <span className="text-sm sm:text-base font-bold text-[#164A31]">
            {formatBDT(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className="text-[11px] sm:text-xs text-[#4F6156] line-through">
              {formatBDT(product.originalPrice)}
            </span>
          ) : null}
          {savings > 0 && (
            <span className="px-1.5 py-0.5 bg-[#E8F3EC] text-[#164A31] text-[10px] font-semibold rounded border border-[#C6DFCF]">
              Save {formatBDT(savings)}
            </span>
          )}
        </div>

        {/* Outlined Add To Cart button */}
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={handleAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed ${
            justAdded
              ? 'bg-[#164A31] border-[#164A31] text-[#F6F8F5]'
              : 'bg-[#FFF6F9] border-[#D97706] text-[#B45309] hover:bg-[#D97706] hover:text-white'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </>
          ) : product.stock <= 0 ? (
            <span>Out of Stock</span>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add To Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onOpenLanding(product.slug)}
          className="mt-2 text-center text-[11px] font-medium text-[#164A31] hover:text-[#C27803] hover:underline underline-offset-4 cursor-pointer"
        >
          Direct COD Order →
        </button>
      </div>
    </article>
  );
}
