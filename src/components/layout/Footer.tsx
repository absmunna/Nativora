import { AppRoute, StoreSettings } from '@/types';

interface FooterProps {
  settings: StoreSettings;
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ settings, onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#142D20] text-[#F6F8F5] border-t border-[#0E2218] pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/15">
          <div>
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="inline-block bg-[#FFF6F9] rounded-xl p-2.5 border border-[#E5D5DA] shadow-xs cursor-pointer"
              aria-label="Nativora Home"
            >
              <img
                src="/images/logo/nativora-logo.webp"
                alt="Nativora™ Logo"
                className="h-20 w-auto object-contain"
              />
            </button>
            <p className="text-xs text-[#F6F8F5]/75 leading-relaxed mt-3 max-w-xs">
              {settings.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FBBF24] mb-3">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs text-[#F6F8F5]/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'home' })}
                  className="hover:text-white cursor-pointer"
                >
                  Storefront
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'orders' })}
                  className="hover:text-white cursor-pointer"
                >
                  Track My Orders
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'account' })}
                  className="hover:text-white cursor-pointer"
                >
                  Customer Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'admin' })}
                  className="hover:text-white cursor-pointer"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FBBF24] mb-3">
              Cash on Delivery Zones
            </h3>
            <ul className="space-y-2 text-xs text-[#F6F8F5]/80 tabular-nums">
              <li>Inside Dhaka: ৳{settings.insideDhakaFee}</li>
              <li>Dhaka Suburbs: ৳{settings.suburbDhakaFee}</li>
              <li>Outside Dhaka: ৳{settings.outsideDhakaFee}</li>
              <li>Free above ৳{settings.freeDeliveryThreshold.toLocaleString()}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FBBF24] mb-3">
              Customer Desk
            </h3>
            <ul className="space-y-2 text-xs text-[#F6F8F5]/80">
              <li>{settings.supportEmail}</li>
              <li className="tabular-nums">{settings.hotline}</li>
              <li>Cash on Delivery Only</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F6F8F5]/60">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p>Firebase Spark Plan · Hostinger Static Hosting</p>
        </div>
      </div>
    </footer>
  );
}
