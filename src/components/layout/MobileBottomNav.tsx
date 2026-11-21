import { Home, LayoutGrid, ShoppingBag, Search, User } from 'lucide-react';
import { AppRoute } from '@/types';

interface MobileBottomNavProps {
  cartCount: number;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onSearch: () => void;
}

export function MobileBottomNav({
  cartCount,
  currentRoute,
  onNavigate,
  onOpenMenu,
  onOpenCart,
  onSearch,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#164A31] text-white border-t border-[#103825] grid grid-cols-5 h-15 shadow-[0_-4px_18px_rgba(20,36,28,0.16)]"
    >
      <button
        type="button"
        onClick={() => onNavigate({ view: 'home' })}
        className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer transition-colors ${
          currentRoute.view === 'home'
            ? 'bg-[#103825] text-[#FBBF24] font-bold'
            : 'text-white/90 hover:bg-[#103825]/60'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px] tracking-wider uppercase">HOME</span>
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer text-white/90 hover:bg-[#103825]/60"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-[10px] tracking-wider uppercase">MENU</span>
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer text-white/90 hover:bg-[#103825]/60"
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4" />
          <span className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D97706] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
            {cartCount}
          </span>
        </div>
        <span className="text-[10px] tracking-wider uppercase">CART</span>
      </button>

      <button
        type="button"
        onClick={onSearch}
        className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer text-white/90 hover:bg-[#103825]/60"
      >
        <Search className="w-4 h-4" />
        <span className="text-[10px] tracking-wider uppercase">SEARCH</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate({ view: 'account' })}
        className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer transition-colors ${
          currentRoute.view === 'account'
            ? 'bg-[#103825] text-[#FBBF24] font-bold'
            : 'text-white/90 hover:bg-[#103825]/60'
        }`}
      >
        <User className="w-4 h-4" />
        <span className="text-[10px] tracking-wider uppercase">ACCOUNT</span>
      </button>
    </nav>
  );
}
