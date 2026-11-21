import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  Truck,
  Banknote,
  Sprout,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useStoreCatalog } from '@/hooks/useStoreCatalog';
import { useCart } from '@/hooks/useCart';
import { AppRoute } from '@/types';
import { SafeImage } from '@/components/shared/SafeImage';
import { CategoryRail } from '@/modules/categories/CategoryRail';
import { ProductCard } from '@/modules/products/ProductCard';

type ProductSortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

function getTimestampMillis(value?: Timestamp | string | { seconds?: number }): number {
  if (!value) return 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    if ('toMillis' in value && typeof value.toMillis === 'function') {
      return value.toMillis();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      return value.seconds * 1000;
    }
  }
  return 0;
}

interface HomeViewProps {
  onNavigate: (route: AppRoute) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { products, categories, banners, settings, isUsingFallbackData, loading } =
    useStoreCatalog();
  const { wishlistIds, toggleWishlist, addToCart } = useCart();

  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('featured');
  const [slideIndex, setSlideIndex] = useState(0);

  const heroSlides = useMemo(() => {
    const primary = banners.find((b) => b.isActive) || banners[0];
    return [
      {
        title: primary?.title || 'From Soil to Soul — Pure Oils & Stone-Milled Spices.',
        subtitle:
          primary?.subtitle ||
          'Nativora™ Mustard Oil (2L & 5L) & 200g glass jars delivered Cash on Delivery.',
        imageUrl: primary?.imageUrl || '/images/banners/banner-001.webp',
        targetSlug: primary?.targetSlug || 'nativora-mustard-oil-2l',
        ctaLabel: primary?.ctaLabel || 'Order Cash on Delivery',
      },
      {
        title: 'খাঁটি সরিষার তেল — ৫ লিটার ফ্যামিলি প্যাক',
        subtitle: '১০০% প্রাকৃতিক ও খাঁটি · 100% Pure & Natural Mustard Oil (5 Liters).',
        imageUrl: '/images/products/product-005.webp',
        targetSlug: 'nativora-mustard-oil-5l',
        ctaLabel: 'Order 5L Mustard Oil',
      },
      {
        title: 'Pure Spices in 200g Cork-Lid Glass Jars',
        subtitle: 'Turmeric Powder (হলুদ গুঁড়া), Chili Powder (মরিচ গুঁড়া) & Coriander Powder (ধনিয়া গুঁড়া).',
        imageUrl: '/images/products/product-002.webp',
        targetSlug: 'nativora-turmeric-powder-200g',
        ctaLabel: 'Shop Pure Spices',
      },
    ];
  }, [banners]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[slideIndex] || heroSlides[0];

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!p.isActive) return false;
      const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.origin || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    const indexed = list.map((item, idx) => ({ item, idx }));
    if (sortBy === 'price-asc') {
      indexed.sort((a, b) => a.item.price - b.item.price || a.idx - b.idx);
    } else if (sortBy === 'price-desc') {
      indexed.sort((a, b) => b.item.price - a.item.price || a.idx - b.idx);
    } else if (sortBy === 'newest') {
      indexed.sort((a, b) => {
        const createdDiff =
          getTimestampMillis(b.item.createdAt) - getTimestampMillis(a.item.createdAt);
        if (createdDiff !== 0) return createdDiff;
        const updatedDiff =
          getTimestampMillis(b.item.updatedAt) - getTimestampMillis(a.item.updatedAt);
        if (updatedDiff !== 0) return updatedDiff;
        return b.idx - a.idx;
      });
    } else if (sortBy === 'featured') {
      indexed.sort(
        (a, b) => Number(!!b.item.featured) - Number(!!a.item.featured) || a.idx - b.idx,
      );
    }
    return indexed.map((entry) => entry.item);
  }, [products, selectedCategoryId, searchQuery, sortBy]);

  return (
    <div className="pb-10">
      {/* Compact Hero Promo Carousel Card */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#EEF4EE] via-white to-[#FDF6E7] border border-[#E5D5DA] shadow-[0_6px_24px_-12px_rgba(22,74,49,0.12)]">
          <div className="grid grid-cols-12 items-center gap-3 sm:gap-8 p-4 sm:p-8 lg:p-10 min-h-[190px] sm:min-h-[280px]">
            <div className="col-span-7 sm:col-span-6 space-y-2.5 sm:space-y-4">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#C27803]">
                Nativora™ · From Soil to Soul
              </p>
              <h1
                className="font-display text-lg sm:text-3xl lg:text-4xl font-semibold leading-tight text-[#164A31]"
                style={{ textWrap: 'balance' }}
              >
                {currentSlide.title}
              </h1>
              <p className="hidden sm:block text-sm text-[#4F6156] leading-relaxed max-w-lg">
                {currentSlide.subtitle}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate({
                      view: 'product',
                      slug: currentSlide.targetSlug,
                      fromFacebook: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[38px]"
                >
                  <span>{currentSlide.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="col-span-5 sm:col-span-6">
              <button
                type="button"
                onClick={() =>
                  onNavigate({
                    view: 'product',
                    slug: currentSlide.targetSlug,
                    fromFacebook: true,
                  })
                }
                className="block w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl bg-[#FFF6F9]/85 border border-[#E2EAE2] p-2 overflow-hidden cursor-pointer"
                aria-label={currentSlide.title}
              >
                <SafeImage
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title}
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
          </div>

          {/* Slide Dots bottom-left */}
          <div className="absolute bottom-3 left-4 sm:left-8 flex items-center gap-1.5">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.targetSlug}
                type="button"
                onClick={() => setSlideIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === slideIndex ? 'w-5 bg-[#164A31]' : 'w-2 bg-[#C8D4C9]'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories Section matching screenshot */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <CategoryRail
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </section>

      {/* Top Selling Products Section */}
      <section
        id="catalog-section"
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-7 sm:pt-10 space-y-5"
      >
        {isUsingFallbackData && (
          <div className="p-3.5 rounded-xl bg-[#FDF6E7] border border-[#E5B869] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#14241C]">
            <span>
              Starter catalog active. Sign in at <strong>Admin</strong> to sync inventory to Cloud
              Firestore.
            </span>
            <button
              type="button"
              onClick={() => onNavigate({ view: 'admin' })}
              className="px-3 py-1.5 bg-[#164A31] hover:bg-[#103825] text-[#F6F8F5] rounded-lg font-medium shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Open Admin
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#164A31] text-center">
            Top Selling Products
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#4F6156] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mustard oil, turmeric, chili, coriander..."
                aria-label="Search products"
                className="w-full pl-10 pr-4 py-2 bg-[#FFF6F9] border border-[#E0CAD1] hover:border-[#9EB0A2] rounded-xl text-sm text-[#14241C] focus:outline-none focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors min-h-[42px]"
              />
            </div>

            <div className="relative sm:w-52 shrink-0">
              <ArrowUpDown className="w-4 h-4 text-[#4F6156] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                aria-label="Sort products"
                className="w-full appearance-none pl-9 pr-9 py-2 bg-[#FFF6F9] border border-[#E0CAD1] hover:border-[#9EB0A2] rounded-xl text-xs sm:text-sm font-medium text-[#164A31] focus:outline-none focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors min-h-[42px] cursor-pointer"
              >
                <option value="featured">Sort: Best Selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#4F6156] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-64 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-12 text-center bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl shadow-[0_2px_10px_-4px_rgba(20,36,28,0.05)]">
            <p className="font-display text-lg text-[#164A31] mb-2">No products found</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
              }}
              className="px-5 py-2.5 bg-[#164A31] hover:bg-[#103825] text-[#F6F8F5] text-xs font-semibold rounded-xl cursor-pointer"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={toggleWishlist}
                onAddToCart={(p) => addToCart(p, 1)}
                onOpenLanding={(slug) =>
                  onNavigate({ view: 'product', slug, fromFacebook: true })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Clean Trust Strip */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-10">
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl shadow-[0_2px_10px_-4px_rgba(20,36,28,0.05)] p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-[#E6ECE6]">
          <div className="flex items-start gap-2.5 lg:pr-5">
            <Banknote className="w-5 h-5 text-[#C27803] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#14241C]">Cash on Delivery</h3>
              <p className="text-[11px] text-[#4F6156]">Pay safely upon arrival</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 lg:px-5">
            <ShieldCheck className="w-5 h-5 text-[#164A31] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#14241C]">
                Verified Stock &amp; Price
              </h3>
              <p className="text-[11px] text-[#4F6156]">Confirmed before dispatch</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 lg:px-5">
            <Sprout className="w-5 h-5 text-[#164A31] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#14241C]">From Soil to Soul</h3>
              <p className="text-[11px] text-[#4F6156]">Pure Oils &amp; Spices</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 lg:pl-5">
            <Truck className="w-5 h-5 text-[#C27803] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#14241C]">
                Nationwide Delivery
              </h3>
              <p className="text-[11px] text-[#4F6156]">
                Free over ৳{settings.freeDeliveryThreshold.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
