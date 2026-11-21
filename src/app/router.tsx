import { AppRoute } from '@/types';
import { HomeView } from '@/modules/home/HomeView';
import { ProductLandingView } from '@/modules/products/ProductLandingView';
import { CheckoutView } from '@/modules/checkout/CheckoutView';
import { OrdersView } from '@/modules/orders/OrdersView';
import { AccountView } from '@/modules/customers/AccountView';
import { AdminDashboardView } from '@/admin/dashboard/AdminDashboardView';

export function parseRouteFromLocation(): AppRoute {
  if (typeof window === 'undefined') return { view: 'home' };

  const params = new URLSearchParams(window.location.search);
  const offerSlug = params.get('offer') || params.get('product') || params.get('p');
  const utmSource = params.get('utm_source') || '';
  if (offerSlug) {
    return {
      view: 'product',
      slug: offerSlug,
      fromFacebook: utmSource.toLowerCase().includes('facebook') || Boolean(params.get('offer')),
    };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname.startsWith('/product/')) {
    const slug = decodeURIComponent(pathname.slice('/product/'.length));
    return slug ? { view: 'product', slug, fromFacebook: utmSource.includes('facebook') } : { view: 'home' };
  }
  if (pathname === '/checkout') return { view: 'checkout' };
  if (pathname === '/orders') return { view: 'orders' };
  if (pathname === '/account') return { view: 'account' };
  if (pathname === '/admin') return { view: 'admin' };
  if (pathname.startsWith('/admin/')) {
    const tab = pathname.slice('/admin/'.length);
    return { view: 'admin', tab };
  }
  return { view: 'home' };
}

export function routeToUrl(route: AppRoute): string {
  switch (route.view) {
    case 'home':
      return '/';
    case 'product':
      return route.fromFacebook
        ? `/?offer=${encodeURIComponent(route.slug)}&utm_source=facebook`
        : `/product/${encodeURIComponent(route.slug)}`;
    case 'checkout':
      return '/checkout';
    case 'orders':
      return '/orders';
    case 'account':
      return '/account';
    case 'admin':
      return route.tab ? `/admin/${encodeURIComponent(route.tab)}` : '/admin';
  }
}

interface RouterViewProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function RouterView({ route, onNavigate }: RouterViewProps) {
  switch (route.view) {
    case 'home':
      return <HomeView onNavigate={onNavigate} />;
    case 'product':
      return (
        <ProductLandingView
          slug={route.slug}
          fromFacebook={route.fromFacebook}
          onNavigate={onNavigate}
        />
      );
    case 'checkout':
      return <CheckoutView onNavigate={onNavigate} />;
    case 'orders':
      return <OrdersView onNavigate={onNavigate} />;
    case 'account':
      return <AccountView onNavigate={onNavigate} />;
    case 'admin':
      return <AdminDashboardView initialTab={route.tab} />;
  }
}
