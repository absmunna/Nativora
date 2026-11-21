import { X, Store, Package, User, Shield, Phone } from 'lucide-react';
import { AppRoute, StoreSettings } from '@/types';

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  currentRoute?: AppRoute;
  onNavigate: (route: AppRoute) => void;
  settings: StoreSettings;
}

export function MenuDrawer({
  open,
  onClose,
  currentRoute,
  onNavigate,
  settings,
}: MenuDrawerProps) {
  if (!open) return null;

  const go = (route: AppRoute) => {
    onClose();
    onNavigate(route);
  };

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl cursor-pointer text-left transition-colors ${
      active
        ? 'bg-[#F5E6EC] text-[#164A31] font-semibold border border-[#C6D5C8]'
        : 'font-medium text-[#14241C] hover:bg-[#FAF4F6] border border-transparent'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-[#14241C]/45 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Store Menu"
    >
      <div
        className="w-80 max-w-[85vw] bg-[#FFF6F9] h-full flex flex-col border-r border-[#E5D5DA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#E5D5DA] flex items-center justify-between">
          <img
            src="/images/logo/nativora-logo.webp"
            alt="Nativora™"
            className="h-14 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-[#4F6156] hover:bg-[#F1F5F1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            type="button"
            onClick={() => go({ view: 'home' })}
            className={navItemClass(currentRoute?.view === 'home')}
          >
            <Store className="w-4 h-4 text-[#C27803]" />
            <span>Storefront Home</span>
          </button>

          <button
            type="button"
            onClick={() => go({ view: 'orders' })}
            className={navItemClass(currentRoute?.view === 'orders')}
          >
            <Package className="w-4 h-4 text-[#C27803]" />
            <span>My Orders</span>
          </button>

          <button
            type="button"
            onClick={() => go({ view: 'account' })}
            className={navItemClass(currentRoute?.view === 'account')}
          >
            <User className="w-4 h-4 text-[#C27803]" />
            <span>Customer Account</span>
          </button>

          <button
            type="button"
            onClick={() => go({ view: 'admin' })}
            className={navItemClass(currentRoute?.view === 'admin')}
          >
            <Shield className="w-4 h-4 text-[#164A31]" />
            <span>Admin Portal</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#E5D5DA] bg-[#FAF4F6] text-xs text-[#4F6156] space-y-1">
          <p className="font-semibold text-[#164A31]">{settings.storeName} · From Soil to Soul</p>
          <p className="flex items-center gap-1.5 tabular-nums">
            <Phone className="w-3.5 h-3.5 text-[#C27803]" />
            <span>{settings.hotline}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
