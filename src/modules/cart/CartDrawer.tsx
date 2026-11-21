import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatBDT } from '@/utils/format';
import { SafeImage } from '@/components/shared/SafeImage';

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, estimatedSubtotal, isCartOpen, closeCart, updateQuantity, removeItem } =
    useCart();

  if (!isCartOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#14241C]/45 backdrop-blur-xs"
      onClick={closeCart}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div
        className="w-full max-w-md bg-[#FAF4F6] h-full flex flex-col border-l border-[#E5D5DA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#FFF6F9] border-b border-[#E5D5DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#164A31]" />
            <h2 className="font-display text-xl font-semibold text-[#164A31]">Your Bag</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="p-2 rounded-lg text-[#4F6156] hover:bg-[#F1F5F1] cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#4F6156]/50 mb-3" strokeWidth={1.5} />
              <p className="font-display text-lg text-[#164A31] mb-1">Your bag is empty</p>
              <p className="text-xs text-[#4F6156] max-w-xs">
                Add Nativora™ Mustard Oil or Pure Spices to request Cash on Delivery.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3.5 pb-4 border-b border-[#E5D5DA] last:border-b-0"
              >
                <div className="w-18 h-18 rounded-xl overflow-hidden bg-[#FFF6F9] border border-[#E5D5DA] p-1 shrink-0">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#14241C] truncate">{item.name}</h3>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-[#4F6156] hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#4F6156]">{item.unitLabel}</p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#E0CAD1] bg-[#FFF6F9] rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, -1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#164A31] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#164A31] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#164A31] tabular-nums">
                      {formatBDT(item.displayPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-[#FFF6F9] border-t border-[#E5D5DA] space-y-3">
            <div className="flex justify-between text-sm font-semibold text-[#14241C]">
              <span>Estimated Subtotal</span>
              <span className="tabular-nums">{formatBDT(estimatedSubtotal)}</span>
            </div>
            <p className="text-[11px] text-[#4F6156]">
              Cash on Delivery only. Admin verifies live product prices and stock prior to
              confirmation.
            </p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                onCheckout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold rounded-xl shadow-xs cursor-pointer min-h-[48px]"
            >
              <span>Checkout (Cash on Delivery)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
