import { useState } from 'react';
import { CheckCircle2, Clock, Truck, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { OrderRecord, OrderStatus, Product, StoreSettings } from '@/types';
import {
  updateOrderStatusAdmin,
  verifyAndConfirmOrderAdmin,
} from '@/services/firebase/firestore';
import { formatBDT, formatOrderStatusLabel, formatTimestamp } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface AdminOrdersPanelProps {
  orders: OrderRecord[];
  products: Product[];
  settings: StoreSettings;
}

const STATUS_FILTERS: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending_verification', label: 'Pending Verification' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function AdminOrdersPanel({ orders, products, settings }: AdminOrdersPanelProps) {
  const { user } = useAuth();
  const { showToast } = useCart();

  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = orders.filter((o) => statusFilter === 'all' || o.status === statusFilter);

  const handleVerifyAndConfirm = async (orderId: string) => {
    if (!user) return;
    setError(null);
    setBusyOrderId(orderId);
    try {
      const res = await verifyAndConfirmOrderAdmin(orderId, user.uid, settings);
      showToast(`Confirmed COD order · Verified Total ${formatBDT(res.verifiedTotal)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setError(null);
    setBusyOrderId(orderId);
    try {
      await updateOrderStatusAdmin(orderId, nextStatus);
      showToast(`Order marked as ${formatOrderStatusLabel(nextStatus)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-[#14241C]">
          COD Orders Queue ({orders.length})
        </h2>
        <p className="text-xs text-[#4F6156]">
          Customers submit untrusted pending requests. Verify live catalog prices and deduct stock
          atomically before confirming COD shipments.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.id === 'all' ? orders.length : orders.filter((o) => o.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer min-h-[38px] ${
                statusFilter === f.id
                  ? 'bg-[#164A31] text-white border-[#164A31] shadow-xs'
                  : 'bg-[#FFF6F9] text-[#14241C] border-[#E5D5DA] hover:border-[#164A31]/50 hover:text-[#164A31]'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-10 text-center text-sm text-[#4F6156] shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          No orders match this filter yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const isBusy = busyOrderId === order.id;
            return (
              <div
                key={order.id}
                className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#F0E2E7]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#164A31]">
                        {order.orderCode}
                      </span>
                      <span className="text-xs text-[#4F6156]">
                        {formatTimestamp(order.createdAt)}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                        {order.source === 'facebook_landing'
                          ? `FB Landing (${order.campaignSlug || 'offer'})`
                          : 'Storefront COD'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#14241C]">
                      {order.customerName} · <span className="font-mono">{order.customerPhone}</span>
                    </p>
                    <p className="text-xs text-[#4F6156]">
                      {order.deliveryZone} — {order.customerAddress}
                    </p>
                    {order.customerEmail && (
                      <p className="text-xs text-[#4F6156]">Email: {order.customerEmail}</p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-[#92400E] bg-[#FDF6E7] border border-[#F2D399] px-2.5 py-1 rounded-lg inline-block mt-1">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-xs font-semibold shrink-0">
                    {order.status === 'pending_verification' && (
                      <span className="inline-flex items-center gap-1.5 text-[#B45309]">
                        <Clock className="w-4 h-4" />
                        Pending Verification
                      </span>
                    )}
                    {order.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1.5 text-[#164A31]">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmed &amp; Stock Deducted
                      </span>
                    )}
                    {order.status === 'dispatched' && (
                      <span className="inline-flex items-center gap-1.5 text-[#164A31]">
                        <Truck className="w-4 h-4" />
                        Dispatched
                      </span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Delivered (COD Collected)
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 text-red-700">
                        <XCircle className="w-4 h-4" />
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Items with Live Catalog Stock Check */}
                <div className="divide-y divide-[#E6ECE6] text-xs">
                  {order.items.map((item, idx) => {
                    const liveProd = products.find((p) => p.id === item.productId);
                    const liveUnit = item.verifiedUnitPrice ?? liveProd?.price ?? 0;
                    const liveStock = liveProd?.stock ?? 0;
                    return (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                      >
                        <div>
                          <span className="font-semibold text-[#14241C]">
                            {item.productName} ({item.unitLabel}) × {item.quantity}
                          </span>
                          {!order.pricingVerified && (
                            <span className="ml-2 text-[#4F6156] tabular-nums">
                              Live stock: {liveProd ? liveStock : 'Not in Firestore'}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#164A31] tabular-nums">
                          {liveUnit > 0
                            ? `${formatBDT(liveUnit * item.quantity)} (${formatBDT(liveUnit)} ea)`
                            : 'Price missing'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#F0E2E7] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#4F6156] tabular-nums">
                    {order.pricingVerified ? (
                      <span className="text-sm font-semibold text-[#164A31]">
                        Verified COD Total: {formatBDT(order.verifiedTotal)} (Subtotal{' '}
                        {formatBDT(order.verifiedSubtotal)} + Fee{' '}
                        {formatBDT(order.verifiedDeliveryFee)})
                      </span>
                    ) : (
                      <span>Unverified client request (verifiedTotal = ৳0 until confirmed)</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === 'pending_verification' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleVerifyAndConfirm(order.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60 min-h-[38px] transition-colors"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Verify Price, Deduct Stock &amp; Confirm COD</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl cursor-pointer min-h-[38px] transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, 'dispatched')}
                        className="px-4 py-2 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[38px] transition-colors"
                      >
                        Mark Dispatched
                      </button>
                    )}

                    {order.status === 'dispatched' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        className="px-4 py-2 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[38px] transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
