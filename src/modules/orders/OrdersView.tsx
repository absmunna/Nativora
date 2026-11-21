import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  MapPin,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { AppRoute, OrderRecord, OrderStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { formatFirebaseAuthError } from '@/services/firebase/auth';
import {
  cancelPendingOrderCustomer,
  subscribeCustomerOrders,
} from '@/services/firebase/firestore';
import { formatBDT, formatOrderStatusLabel, formatTimestamp } from '@/utils/format';

interface OrdersViewProps {
  onNavigate: (route: AppRoute) => void;
}

type OrderFilterTab = 'all' | 'pending' | 'active' | 'delivered' | 'cancelled';

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending_verification: 'bg-[#FDF6E7] border-[#F2D399] text-[#B45309]',
  confirmed: 'bg-[#F5E6EC] border-[#C6D5C8] text-[#164A31]',
  dispatched: 'bg-sky-50 border-sky-200 text-sky-900',
  delivered: 'bg-[#164A31] border-[#164A31] text-white',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
};

function renderStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'pending_verification':
      return <Clock className="w-3.5 h-3.5" />;
    case 'confirmed':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'dispatched':
      return <Truck className="w-3.5 h-3.5" />;
    case 'delivered':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'cancelled':
      return <XCircle className="w-3.5 h-3.5" />;
  }
}

export function OrdersView({ onNavigate }: OrdersViewProps) {
  const { user, authReady } = useAuth();
  const { showToast } = useCart();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsub = subscribeCustomerOrders(
      user.uid,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        setError(formatFirebaseAuthError(err));
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user, authReady]);

  const filteredOrders = useMemo(() => {
    switch (filterTab) {
      case 'pending':
        return orders.filter((o) => o.status === 'pending_verification');
      case 'active':
        return orders.filter((o) => o.status === 'confirmed' || o.status === 'dispatched');
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered');
      case 'cancelled':
        return orders.filter((o) => o.status === 'cancelled');
      default:
        return orders;
    }
  }, [orders, filterTab]);

  const handleCancel = async (orderId: string, orderCode: string) => {
    setError(null);
    setCancellingId(orderId);
    try {
      await cancelPendingOrderCustomer(orderId);
      showToast(`Order ${orderCode} cancelled`);
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F6156] hover:text-[#164A31] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309] mb-1">
            Order History
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14241C]">
            My Orders
          </h1>
        </div>

        {user && orders.length > 0 && (
          <p className="text-xs text-[#4F6156] tabular-nums">
            Showing {filteredOrders.length} of {orders.length}{' '}
            {orders.length === 1 ? 'order' : 'orders'}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      {!loading && user && orders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: `All (${orders.length})` },
              {
                id: 'pending',
                label: `Pending (${orders.filter((o) => o.status === 'pending_verification').length})`,
              },
              {
                id: 'active',
                label: `Confirmed & Dispatched (${
                  orders.filter((o) => o.status === 'confirmed' || o.status === 'dispatched').length
                })`,
              },
              {
                id: 'delivered',
                label: `Delivered (${orders.filter((o) => o.status === 'delivered').length})`,
              },
              {
                id: 'cancelled',
                label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
              },
            ] as Array<{ id: OrderFilterTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-[#164A31] border-[#164A31] text-white shadow-xs'
                  : 'bg-[#FFF6F9] border-[#E5D5DA] text-[#4F6156] hover:border-[#164A31]/40 hover:text-[#164A31]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-44 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !user || orders.length === 0 ? (
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-8 sm:p-10 text-center shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          <Package className="w-10 h-10 text-[#4F6156]/50 mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="font-display text-xl text-[#14241C] mb-1">
            {user ? 'No orders yet' : 'Sign in to view your orders'}
          </h2>
          <p className="text-xs text-[#4F6156] mb-6 max-w-md mx-auto leading-relaxed">
            {user
              ? 'Orders placed from this account or guest session appear here automatically with live verification, items, and COD totals.'
              : 'Orders are linked to your Firebase UID. Place a Cash on Delivery order as a guest or sign in to view your saved order history.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!user && (
              <button
                type="button"
                onClick={() => onNavigate({ view: 'account' })}
                className="px-5 py-3 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] transition-colors"
              >
                Sign In / Account
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="px-6 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] transition-colors"
            >
              Explore Storefront
            </button>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-8 text-center space-y-3 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          <p className="text-sm font-medium text-[#14241C]">No orders in this filter.</p>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className="px-4 py-2 text-xs font-semibold bg-[#FAF4F6] border border-[#E5D5DA] hover:border-[#164A31]/40 rounded-xl text-[#164A31] cursor-pointer"
          >
            Show All Orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <article
              key={order.id}
              className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
            >
              {/* Header: Order Code, Timestamp, Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E2E7]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[#164A31]">
                      {order.orderCode}
                    </span>
                    <span aria-hidden="true" className="text-[#4F6156]">
                      ·
                    </span>
                    <span className="text-xs text-[#4F6156]">
                      {formatTimestamp(order.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#4F6156] mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>
                      {order.customerName} · {order.deliveryZone}
                    </span>
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold self-start sm:self-auto ${
                    STATUS_BADGE_STYLES[order.status]
                  }`}
                >
                  {renderStatusIcon(order.status)}
                  <span>{formatOrderStatusLabel(order.status)}</span>
                </span>
              </div>

              {/* Ordered Items */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4F6156]">
                  Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
                </p>
                <div className="divide-y divide-[#E6ECE6] text-sm">
                  {order.items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="text-[#14241C]">
                        {item.productName}{' '}
                        <span className="text-xs text-[#4F6156]">
                          ({item.unitLabel}) × {item.quantity}
                        </span>
                      </span>
                      {item.verifiedUnitPrice ? (
                        <span className="tabular-nums font-semibold text-[#164A31] shrink-0">
                          {formatBDT(item.verifiedUnitPrice * item.quantity)}
                        </span>
                      ) : (
                        <span className="text-xs text-[#4F6156] shrink-0">
                          Pending price check
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Total Summary */}
              <div className="pt-3 border-t border-[#F0E2E7] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="text-xs text-[#4F6156] space-y-1">
                  <p>
                    <strong className="text-[#14241C]">Address:</strong> {order.customerAddress}
                  </p>
                  {order.notes && (
                    <p>
                      <strong className="text-[#14241C]">Note:</strong> {order.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {order.pricingVerified ? (
                    <div className="text-xs text-[#4F6156] sm:text-right space-y-0.5 tabular-nums">
                      <p>
                        Subtotal: <span className="text-[#14241C]">{formatBDT(order.verifiedSubtotal)}</span>{' '}
                        · Delivery:{' '}
                        <span className="text-[#14241C]">
                          {order.verifiedDeliveryFee === 0
                            ? 'Free'
                            : formatBDT(order.verifiedDeliveryFee)}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-[#164A31]">
                        COD Total: {formatBDT(order.verifiedTotal)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-[#4F6156] sm:text-right">
                      <p className="font-semibold text-[#B45309]">Total: Pending Verification</p>
                      <p>Admin verifies live stock &amp; price before dispatch</p>
                    </div>
                  )}

                  {order.status === 'pending_verification' && (
                    <button
                      type="button"
                      disabled={cancellingId === order.id}
                      onClick={() => void handleCancel(order.id, order.orderCode)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-xl cursor-pointer disabled:opacity-50 self-start sm:self-end transition-colors"
                    >
                      {cancellingId === order.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <span>Cancel Request</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
