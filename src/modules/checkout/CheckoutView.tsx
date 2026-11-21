import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { AppRoute, DeliveryZone } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useStoreCatalog } from '@/hooks/useStoreCatalog';
import { signInAsGuest, formatFirebaseAuthError } from '@/services/firebase/auth';
import { createPendingCodOrder, upsertCustomerProfile } from '@/services/firebase/firestore';
import { estimateDeliveryFee, formatBDT } from '@/utils/format';
import { validateCustomerFields } from '@/utils/validation';

interface CheckoutViewProps {
  onNavigate: (route: AppRoute) => void;
}

const ZONES: DeliveryZone[] = ['Inside Dhaka', 'Dhaka Suburbs', 'Outside Dhaka'];

export function CheckoutView({ onNavigate }: CheckoutViewProps) {
  const { user, customerProfile, refreshProfile } = useAuth();
  const { items, estimatedSubtotal, clearCart, showToast } = useCart();
  const { settings } = useStoreCatalog();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<DeliveryZone>('Inside Dhaka');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  useEffect(() => {
    if (customerProfile) {
      setName((p) => p || customerProfile.name);
      setPhone((p) => p || customerProfile.phone);
      setEmail((p) => p || customerProfile.email || '');
      setAddress((p) => p || customerProfile.address);
      setZone(customerProfile.zone);
    }
  }, [customerProfile]);

  const estDelivery = estimateDeliveryFee(estimatedSubtotal, zone, settings);
  const estTotal = estimatedSubtotal + estDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your bag is empty.');
      return;
    }

    const validationError = validateCustomerFields({
      name,
      phone,
      email,
      address,
      zone,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const activeUser = user || (await signInAsGuest());

      await upsertCustomerProfile({
        uid: activeUser.uid,
        name,
        phone,
        email: email || activeUser.email || '',
        address,
        zone,
        isAnonymous: activeUser.isAnonymous,
      });

      const created = await createPendingCodOrder({
        customerUid: activeUser.uid,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || activeUser.email || '',
        customerAddress: address,
        deliveryZone: zone,
        source: 'storefront',
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          unitLabel: item.unitLabel,
          quantity: item.quantity,
        })),
      });

      await refreshProfile();
      clearCart();
      setConfirmedCode(created.orderCode);
      showToast(`COD Order ${created.orderCode} submitted`);
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedCode) {
    return (
      <div className="max-w-xl mx-auto px-4 py-14 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#164A31] text-[#FBBF24] flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-[#14241C]">
          Order Request {confirmedCode} Submitted
        </h1>
        <p className="text-sm text-[#4F6156] leading-relaxed">
          Your Cash on Delivery order is currently <strong>Pending Verification</strong>. Our team
          verifies live catalog prices and inventory before confirming dispatch.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate({ view: 'orders' })}
            className="px-6 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] transition-colors"
          >
            Track Order Status
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className="px-6 py-3 bg-[#FFF6F9] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] text-sm font-medium rounded-xl cursor-pointer min-h-[44px] transition-colors"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        type="button"
        onClick={() => onNavigate({ view: 'home' })}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#164A31] hover:text-[#D97706] mb-6 cursor-pointer min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </button>

      {items.length === 0 ? (
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-10 text-center shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          <h1 className="font-display text-2xl text-[#14241C] mb-2">Your bag is empty</h1>
          <p className="text-sm text-[#4F6156] mb-6">Add items to submit a Cash on Delivery request.</p>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className="px-6 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Browse Pantry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-8 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
            <div className="pb-3 border-b border-[#F0E2E7]">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14241C]">
                Cash on Delivery Checkout
              </h1>
              <p className="text-xs text-[#4F6156] mt-1">
                {user
                  ? user.isAnonymous
                    ? 'Checking out as Guest (Anonymous Firebase UID).'
                    : `Signed in as ${user.email}`
                  : 'Guest checkout will create a private Anonymous Firebase UID session.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Mobile Number *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-email" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Email (Optional)
              </label>
              <input
                id="chk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="chk-address" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Full Delivery Address *
              </label>
              <textarea
                id="chk-address"
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-zone" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Delivery Zone
                </label>
                <select
                  id="chk-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value as DeliveryZone)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  id="chk-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5 h-fit shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4F6156] pb-3 border-b border-[#F0E2E7]">
                Pending COD Request Summary
              </h2>

              <div className="space-y-2.5 text-sm">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between gap-2">
                    <span className="text-[#14241C]">
                      {item.name} ({item.unitLabel}) × {item.quantity}
                    </span>
                    <span className="font-semibold text-[#164A31] tabular-nums shrink-0">
                      {formatBDT(item.displayPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F0E2E7] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#4F6156]">
                  <span>Estimated Subtotal</span>
                  <span className="tabular-nums text-[#14241C]">{formatBDT(estimatedSubtotal)}</span>
                </div>
                <div className="flex justify-between text-[#4F6156]">
                  <span>Estimated Delivery ({zone})</span>
                  <span className="tabular-nums text-[#14241C]">
                    {estDelivery === 0 ? 'Free' : formatBDT(estDelivery)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#164A31] pt-2.5 border-t border-[#F0E2E7]">
                  <span>Estimated COD Total</span>
                  <span className="tabular-nums">{formatBDT(estTotal)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF4F6] border border-[#E5D5DA] flex items-start gap-2.5 text-[11px] text-[#4F6156]">
                <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  Payment: Cash on Delivery only. Prices &amp; stock are verified by Admin before
                  confirmation.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-60 text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[48px] transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting COD Request...</span>
                </>
              ) : (
                <span>Place Pending COD Order</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
