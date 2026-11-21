import { Menu, ShoppingCart } from 'lucide-react';
import { AppRoute } from '@/types';

interface NavbarProps {
  cartCount: number;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCart: () => void;
  onOpenMenu: () => void;
}

export function Navbar({
  cartCount,
  currentRoute,
  onNavigate,
  onOpenCart,
  onOpenMenu,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF6F9]/95 backdrop-blur-md border-t-0 border-b border-[#E5D5DA] shadow-[0_1px_8px_rgba(20,36,28,0.06)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 md:h-22 flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger Menu + Desktop Brand Lockup */}
        <div className="flex flex-1 md:flex-none items-center justify-start gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 -ml-1 text-[#164A31] hover:bg-[#F1F5F1] rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            aria-label="Nativora Home"
            className="hidden md:inline-flex items-center gap-3.5 shrink-0 cursor-pointer focus:outline-none group py-1"
          >
            <img
              src="/images/logo/nativora-logo.webp"
              alt="Nativora™ — From Soil to Soul"
              className="h-15 lg:h-17 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span className="hidden xl:flex flex-col border-l border-[#E5D5DA] pl-3.5 text-left leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#164A31]">
                From Soil to Soul
              </span>
              <span className="text-[11px] text-[#C27803] font-medium mt-0.5">
                Pure Oils &amp; Spices
              </span>
            </span>
          </button>
        </div>

        {/* Mobile Centered Logo */}
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          aria-label="Nativora Home"
          className="md:hidden inline-flex items-center justify-center shrink-0 cursor-pointer py-1"
        >
          <img
            src="/images/logo/nativora-logo.webp"
            alt="Nativora™ — From Soil to Soul"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </button>

        {/* Desktop Nav Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4F6156]"
        >
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className={`hover:text-[#164A31] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentRoute.view === 'home' ? 'text-[#164A31] font-semibold underline' : ''
            }`}
          >
            Storefront
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'orders' })}
            className={`hover:text-[#164A31] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentRoute.view === 'orders' ? 'text-[#164A31] font-semibold underline' : ''
            }`}
          >
            My Orders
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'account' })}
            className={`hover:text-[#164A31] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentRoute.view === 'account' ? 'text-[#164A31] font-semibold underline' : ''
            }`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'admin' })}
            className={`hover:text-[#164A31] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentRoute.view === 'admin' ? 'text-[#C27803] font-semibold underline' : ''
            }`}
          >
            Admin
          </button>
        </nav>

        {/* Right: Cart Icon + Badge */}
        <div className="flex flex-1 md:flex-none items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open cart (${cartCount} items)`}
            className="relative inline-flex items-center gap-2 px-2.5 sm:px-4 py-2 text-[#164A31] md:bg-[#164A31] md:hover:bg-[#103825] md:text-[#F6F8F5] rounded-xl border border-transparent md:border-[#103825] transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 md:w-4 md:h-4 md:text-[#FBBF24]" />
              <span className="md:hidden absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            </div>
            <span className="hidden md:inline text-sm font-medium tabular-nums">
              Bag ({cartCount})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
