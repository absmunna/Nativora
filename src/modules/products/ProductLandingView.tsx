import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  Loader2,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { AppRoute, DeliveryZone, Product, ProductReview } from '@/types';
import { useStoreCatalog } from '@/hooks/useStoreCatalog';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { signInAsGuest, formatFirebaseAuthError } from '@/services/firebase/auth';
import {
  createPendingCodOrder,
  subscribeProductReviews,
  upsertCustomerProfile,
} from '@/services/firebase/firestore';
import { estimateDeliveryFee, formatBDT } from '@/utils/format';
import { validateCustomerFields } from '@/utils/validation';
import { SafeImage } from '@/components/shared/SafeImage';
import { ProductReviewsSection } from '@/modules/products/ProductReviewsSection';

interface ProductLandingViewProps {
  slug: string;
  fromFacebook?: boolean;
  onNavigate: (route: AppRoute) => void;
}

const ZONES: DeliveryZone[] = ['Inside Dhaka', 'Dhaka Suburbs', 'Outside Dhaka'];

export function ProductLandingView({
  slug,
  fromFacebook,
  onNavigate,
}: ProductLandingViewProps) {
  const { products, settings } = useStoreCatalog();
  const { user, customerProfile, refreshProfile } = useAuth();
  const { addToCart, showToast } = useCart();

  const product: Product | undefined = products.find((p) => p.slug === slug || p.id === slug);

  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<DeliveryZone>('Inside Dhaka');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    if (customerProfile) {
      setName((prev) => prev || customerProfile.name);
      setPhone((prev) => prev || customerProfile.phone);
      setEmail((prev) => prev || customerProfile.email || '');
      setAddress((prev) => prev || customerProfile.address);
      setZone(customerProfile.zone);
    }
  }, [customerProfile]);

  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }
    setReviewsLoading(true);
    setReviewsError(null);
    const unsub = subscribeProductReviews(
      product.id,
      (list) => {
        setReviews(list);
        setReviewsLoading(false);
      },
      (err) => {
        setReviewsError(err.message);
        setReviewsLoading(false);
      },
    );
    return () => unsub();
  }, [product?.id]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-[#164A31] mb-2">Product not found</h1>
        <p className="text-sm text-[#4F6156] mb-6">
          This harvest item may be out of season or unavailable.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          className="px-5 py-2.5 bg-[#164A31] hover:bg-[#103825] text-[#F6F8F5] text-sm font-medium rounded-xl cursor-pointer"
        >
          Back to Storefront
        </button>
      </div>
    );
  }

  const estSubtotal = product.price * quantity;
  const estDelivery = estimateDeliveryFee(estSubtotal, zone, settings);
  const estTotal = estSubtotal + estDelivery;

  const fbUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?offer=${product.slug}&utm_source=facebook`
      : `/?offer=${product.slug}&utm_source=facebook`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fbUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    if (product.stock < quantity) {
      setError(`Only ${product.stock} unit(s) available in stock right now.`);
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
        source: fromFacebook ? 'facebook_landing' : 'storefront',
        campaignSlug: product.slug,
        notes,
        items: [
          {
            productId: product.id,
            productName: product.name,
            unitLabel: product.unitLabel,
            quantity,
          },
        ],
      });

      await refreshProfile();
      setSubmittedCode(created.orderCode);
      showToast(`Pending COD order ${created.orderCode} submitted`);
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#164A31] hover:text-[#C27803] cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#FFF6F9] border border-[#E5D5DA] hover:border-[#164A31] rounded-xl shadow-xs cursor-pointer min-h-[40px]"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#164A31]" />
              <span>Facebook Link Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#C27803]" />
              <span>Copy Facebook Product Link</span>
            </>
          )}
        </button>
      </div>

      {/* Product Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#FFF6F9] border border-[#E5D5DA] shadow-[0_4px_16px_-6px_rgba(20,36,28,0.08)] p-4">
            <SafeImage
              src={product.imageUrl}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#C27803]">
            {product.categoryName} {product.origin ? `· ${product.origin}` : ''}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#164A31]">
            {product.name}
          </h1>
          <button
            type="button"
            onClick={() =>
              document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="inline-flex items-center gap-2 text-xs text-[#4F6156] hover:text-[#164A31] cursor-pointer"
          >
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const avg =
                  reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    : 0;
                const filled = reviews.length > 0 && star <= Math.round(avg);
                return (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      filled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#C8D4C9]'
                    }`}
                  />
                );
              })}
            </span>
            {reviews.length > 0 ? (
              <span className="font-medium text-[#164A31] tabular-nums">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} (
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            ) : (
              <span>No reviews yet · Write a review</span>
            )}
          </button>
          <div className="flex items-baseline gap-3 tabular-nums">
            <span className="text-2xl font-semibold text-[#164A31]">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-sm text-[#4F6156] line-through">
                {formatBDT(product.originalPrice)}
              </span>
            ) : null}
            <span className="text-xs text-[#4F6156]">{product.unitLabel}</span>
          </div>

          <p className="text-sm text-[#4F6156] leading-relaxed">{product.description}</p>

          {product.purityHighlights && product.purityHighlights.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {product.purityHighlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-[#14241C]">
                  <CheckCircle2 className="w-4 h-4 text-[#164A31] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                document.getElementById('cod-order-request')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="flex-1 sm:flex-none px-6 py-3 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold rounded-xl shadow-xs cursor-pointer min-h-[44px]"
            >
              Order Cash on Delivery
            </button>
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => addToCart(product, quantity)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#164A31] hover:bg-[#103825] text-[#F6F8F5] text-sm font-medium rounded-xl cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4 text-[#FBBF24]" />
              <span>Add to Bag</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1-Step COD Pending Order Request Form */}
      <section
        id="cod-order-request"
        className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)] p-5 sm:p-8"
      >
        {submittedCode ? (
          <div className="max-w-xl mx-auto text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-xl bg-[#164A31] text-[#FBBF24] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#164A31]">
              Order Request {submittedCode} Received
            </h2>
            <p className="text-sm text-[#4F6156] leading-relaxed">
              Your Cash on Delivery request is <strong>Pending Verification</strong>. Our team
              will verify live stock and final pricing before confirming dispatch.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate({ view: 'orders' })}
                className="px-5 py-2.5 bg-[#164A31] hover:bg-[#103825] text-[#F6F8F5] text-sm font-medium rounded-xl cursor-pointer min-h-[44px]"
              >
                View My Orders
              </button>
              <button
                type="button"
                onClick={() => setSubmittedCode(null)}
                className="px-5 py-2.5 border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] text-sm font-medium rounded-xl cursor-pointer min-h-[44px]"
              >
                Order Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#164A31]">
                  Cash on Delivery Order Request
                </h2>
                <p className="text-xs text-[#4F6156] mt-1">
                  Guest checkout enabled via Anonymous Firebase Auth. No upfront payment required.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lp-name" className="block text-xs font-semibold text-[#164A31] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="lp-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9] min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="lp-phone" className="block text-xs font-semibold text-[#164A31] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="lp-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lp-email" className="block text-xs font-semibold text-[#164A31] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  id="lp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9] min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="lp-address" className="block text-xs font-semibold text-[#164A31] mb-1">
                  Delivery Address *
                </label>
                <textarea
                  id="lp-address"
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area, Thana / District"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lp-zone" className="block text-xs font-semibold text-[#164A31] mb-1">
                    Delivery Zone
                  </label>
                  <select
                    id="lp-zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value as DeliveryZone)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9] min-h-[44px]"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lp-notes" className="block text-xs font-semibold text-[#164A31] mb-1">
                    Delivery Note (Optional)
                  </label>
                  <input
                    id="lp-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preferred delivery window"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] focus:bg-[#FFF6F9] min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FAF4F6] border border-[#E5D5DA] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4F6156]">
                  Order Request Summary
                </h3>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-[#14241C]">{product.name}</p>
                    <p className="text-xs text-[#4F6156]">{product.unitLabel}</p>
                  </div>
                  <div className="inline-flex items-center border border-[#E0CAD1] bg-[#FFF6F9] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-2 text-[#164A31] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                      aria-label="Increase quantity"
                      className="p-2 text-[#164A31] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5D5DA] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#4F6156]">
                    <span>Estimated Subtotal</span>
                    <span className="tabular-nums">{formatBDT(estSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#4F6156]">
                    <span>Estimated Delivery ({zone})</span>
                    <span className="tabular-nums">
                      {estDelivery === 0 ? 'Free' : formatBDT(estDelivery)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#164A31] pt-2 border-t border-[#E5D5DA]">
                    <span>Estimated COD Total</span>
                    <span className="tabular-nums">{formatBDT(estTotal)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-[#4F6156] bg-[#FFF6F9] p-3 rounded-xl border border-[#E5D5DA]">
                  <ShieldCheck className="w-4 h-4 text-[#C27803] shrink-0 mt-0.5" />
                  <span>
                    Final price and stock availability are verified by Nativora Admin before
                    confirming your Cash on Delivery shipment.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || product.stock <= 0}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-60 text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[48px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Submit COD Order Request</span>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        reviews={reviews}
        loading={reviewsLoading}
        error={reviewsError}
      />
    </div>
  );
}
