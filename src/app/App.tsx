import { useCallback, useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { AppRoute } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useStoreCatalog } from '@/hooks/useStoreCatalog';
import { formatBDT } from '@/utils/format';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MenuDrawer } from '@/components/layout/MenuDrawer';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/modules/cart/CartDrawer';
import { AppProviders } from '@/app/providers';
import { RouterView, parseRouteFromLocation, routeToUrl } from '@/app/router';

function AppShell() {
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromLocation());
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount, estimatedSubtotal, openCart } = useCart();
  const { settings } = useStoreCatalog();

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextUrl = routeToUrl(nextRoute);
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (route.view !== 'home') {
      navigate({ view: 'home' });
      window.setTimeout(() => {
        const el = document.getElementById('catalog-search');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLInputElement | null)?.focus();
      }, 220);
    } else {
      const el = document.getElementById('catalog-search');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLInputElement | null)?.focus();
    }
  }, [route.view, navigate]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRouteFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4F6] text-[#14241C] font-sans antialiased">
      <Navbar
        cartCount={totalCount}
        currentRoute={route}
        onNavigate={navigate}
        onOpenCart={openCart}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <main className="flex-1">
        <RouterView route={route} onNavigate={navigate} />
      </main>

      <Footer settings={settings} onNavigate={navigate} />

      {/* Floating Right-Edge Cart Tab */}
      <button
        type="button"
        onClick={openCart}
        aria-label="Open quick cart summary"
        className="fixed right-0 top-[54%] -translate-y-1/2 z-30 rounded-l-xl overflow-hidden shadow-[0_6px_20px_-4px_rgba(20,36,28,0.2)] border border-r-0 border-[#E5D5DA] cursor-pointer text-center"
      >
        <div className="bg-[#164A31] text-white px-2.5 py-2 flex flex-col items-center">
          <ShoppingBag className="w-4 h-4 mb-0.5 text-[#FBBF24]" />
          <span className="text-[11px] font-semibold leading-tight tabular-nums">
            {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="bg-[#FFF6F9] text-[#164A31] px-2.5 py-1.5 text-[11px] font-bold tabular-nums border-t border-[#F0E2E7]">
          {formatBDT(estimatedSubtotal)}
        </div>
      </button>

      <MobileBottomNav
        cartCount={totalCount}
        currentRoute={route}
        onNavigate={navigate}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCart={openCart}
        onSearch={handleSearchFocus}
      />

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentRoute={route}
        onNavigate={navigate}
        settings={settings}
      />

      <CartDrawer onCheckout={() => navigate({ view: 'checkout' })} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </ErrorBoundary>
  );
}
