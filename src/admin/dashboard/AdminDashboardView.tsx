import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  Users,
  Layers,
  Image as ImageIcon,
  Settings,
  Database,
  Loader2,
  LogOut,
} from 'lucide-react';
import { CustomerProfile, OrderRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useStoreCatalog } from '@/hooks/useStoreCatalog';
import { useCart } from '@/hooks/useCart';
import { logoutCurrentUser } from '@/services/firebase/auth';
import {
  seedInitialCatalogAdmin,
  subscribeAllCustomersAdmin,
  subscribeAllOrdersAdmin,
} from '@/services/firebase/firestore';
import { formatBDT } from '@/utils/format';
import { AdminLoginGate } from '@/admin/auth/AdminLoginGate';
import { AdminOrdersPanel } from '@/admin/orders/AdminOrdersPanel';
import { AdminProductsPanel } from '@/admin/products/AdminProductsPanel';
import { AdminCategoriesPanel } from '@/admin/categories/AdminCategoriesPanel';
import { AdminCustomersPanel } from '@/admin/customers/AdminCustomersPanel';
import { AdminBannersPanel } from '@/admin/banners/AdminBannersPanel';
import { AdminSettingsPanel } from '@/admin/settings/AdminSettingsPanel';

type AdminTab = 'orders' | 'products' | 'categories' | 'customers' | 'banners' | 'settings';

export function AdminDashboardView({ initialTab }: { initialTab?: string }) {
  const { user, authReady, isAdmin } = useAuth();
  const { products, categories, banners, settings, isUsingFallbackData } = useStoreCatalog();
  const { showToast } = useCart();

  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialTab && ['orders', 'products', 'categories', 'customers', 'banners', 'settings'].includes(initialTab)
      ? (initialTab as AdminTab)
      : 'orders',
  );
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !isAdmin) return;
    const unsubOrders = subscribeAllOrdersAdmin(
      (list) => setOrders(list),
      (err) => setAdminError(err.message),
    );
    const unsubCustomers = subscribeAllCustomersAdmin(
      (list) => setCustomers(list),
      (err) => setAdminError(err.message),
    );
    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, [authReady, isAdmin]);

  if (!authReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#4F6156]">
        Verifying Firebase session...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLoginGate />;
  }

  const pendingCount = orders.filter((o) => o.status === 'pending_verification').length;
  const verifiedRevenue = orders
    .filter((o) => o.pricingVerified && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.verifiedTotal, 0);

  const handleSeedCatalog = async () => {
    setAdminError(null);
    setSeeding(true);
    try {
      await seedInitialCatalogAdmin();
      showToast('Starter catalog, categories, banners & settings seeded to Firestore');
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : 'Unable to seed Firestore catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof Package }> = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5D5DA]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
            Spark Plan Admin Console · UID Verified
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14241C]">
            Nativora Operations
          </h1>
          <p className="text-xs text-[#4F6156] mt-1 font-mono">
            {user.email} · UID: {user.uid}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedCatalog}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[42px] disabled:opacity-60 transition-colors"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>
              {isUsingFallbackData ? 'Seed Starter Catalog to Firestore' : 'Sync Starter Seed'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => logoutCurrentUser()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FFF6F9] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] text-xs font-semibold rounded-xl cursor-pointer min-h-[42px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {adminError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 break-words">
          {adminError}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]">
          <p className="text-xs text-[#4F6156]">Pending COD Requests</p>
          <p className="font-display text-2xl font-semibold text-[#B45309] tabular-nums mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]">
          <p className="text-xs text-[#4F6156]">Verified COD Volume</p>
          <p className="font-display text-2xl font-semibold text-[#164A31] tabular-nums mt-1">
            {formatBDT(verifiedRevenue)}
          </p>
        </div>
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]">
          <p className="text-xs text-[#4F6156]">Catalog SKUs</p>
          <p className="font-display text-2xl font-semibold text-[#14241C] tabular-nums mt-1">
            {products.length}
          </p>
        </div>
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]">
          <p className="text-xs text-[#4F6156]">Private Customer Profiles</p>
          <p className="font-display text-2xl font-semibold text-[#14241C] tabular-nums mt-1">
            {customers.length}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border whitespace-nowrap shrink-0 cursor-pointer min-h-[42px] transition-colors ${
                active
                  ? 'bg-[#164A31] text-white border-[#164A31] shadow-xs'
                  : 'bg-[#FFF6F9] text-[#14241C] border-[#E5D5DA] hover:border-[#164A31]/50 hover:text-[#164A31]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#FBBF24]' : 'text-[#4F6156]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Panel */}
      <div>
        {activeTab === 'orders' && (
          <AdminOrdersPanel orders={orders} products={products} settings={settings} />
        )}
        {activeTab === 'products' && (
          <AdminProductsPanel products={products} categories={categories} />
        )}
        {activeTab === 'categories' && <AdminCategoriesPanel categories={categories} />}
        {activeTab === 'customers' && (
          <AdminCustomersPanel customers={customers} orders={orders} />
        )}
        {activeTab === 'banners' && <AdminBannersPanel banners={banners} products={products} />}
        {activeTab === 'settings' && <AdminSettingsPanel settings={settings} />}
      </div>
    </div>
  );
}
