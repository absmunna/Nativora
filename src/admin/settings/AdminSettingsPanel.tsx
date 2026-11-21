import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { StoreSettings } from '@/types';
import { saveSettingsAdmin } from '@/services/firebase/firestore';
import { useCart } from '@/hooks/useCart';

interface AdminSettingsPanelProps {
  settings: StoreSettings;
}

export function AdminSettingsPanel({ settings }: AdminSettingsPanelProps) {
  const { showToast } = useCart();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [hotline, setHotline] = useState(settings.hotline || '');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || '');
  const [insideDhakaFee, setInsideDhakaFee] = useState(String(settings.insideDhakaFee));
  const [suburbDhakaFee, setSuburbDhakaFee] = useState(String(settings.suburbDhakaFee));
  const [outsideDhakaFee, setOutsideDhakaFee] = useState(String(settings.outsideDhakaFee));
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    String(settings.freeDeliveryThreshold),
  );
  const [promoNotice, setPromoNotice] = useState(settings.promoNotice || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStoreName(settings.storeName);
    setTagline(settings.tagline || '');
    setHotline(settings.hotline || '');
    setSupportEmail(settings.supportEmail || '');
    setInsideDhakaFee(String(settings.insideDhakaFee));
    setSuburbDhakaFee(String(settings.suburbDhakaFee));
    setOutsideDhakaFee(String(settings.outsideDhakaFee));
    setFreeDeliveryThreshold(String(settings.freeDeliveryThreshold));
    setPromoNotice(settings.promoNotice || '');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await saveSettingsAdmin({
        id: 'store',
        storeName: storeName.trim() || 'Nativora',
        tagline: tagline.trim(),
        hotline: hotline.trim(),
        supportEmail: supportEmail.trim(),
        insideDhakaFee: Math.max(0, Number(insideDhakaFee) || 0),
        suburbDhakaFee: Math.max(0, Number(suburbDhakaFee) || 0),
        outsideDhakaFee: Math.max(0, Number(outsideDhakaFee) || 0),
        freeDeliveryThreshold: Math.max(0, Number(freeDeliveryThreshold) || 0),
        promoNotice: promoNotice.trim(),
      });
      showToast('Store settings saved to Firestore');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
    >
      <div className="pb-3 border-b border-[#F0E2E7]">
        <h2 className="font-display text-xl font-semibold text-[#14241C]">
          Storefront &amp; COD Delivery Settings
        </h2>
        <p className="text-xs text-[#4F6156]">
          Zone fees configured here are used during Admin order verification transactions.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Store Name *</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Hotline</label>
          <input
            type="text"
            value={hotline}
            onChange={(e) => setHotline(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Support Email</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
            Free COD Delivery Threshold (৳ BDT)
          </label>
          <input
            type="number"
            min={0}
            value={freeDeliveryThreshold}
            onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
            Inside Dhaka Fee (৳)
          </label>
          <input
            type="number"
            min={0}
            value={insideDhakaFee}
            onChange={(e) => setInsideDhakaFee(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
            Dhaka Suburbs Fee (৳)
          </label>
          <input
            type="number"
            min={0}
            value={suburbDhakaFee}
            onChange={(e) => setSuburbDhakaFee(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
            Outside Dhaka Fee (৳)
          </label>
          <input
            type="number"
            min={0}
            value={outsideDhakaFee}
            onChange={(e) => setOutsideDhakaFee(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Promo Notice</label>
        <input
          type="text"
          value={promoNotice}
          onChange={(e) => setPromoNotice(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] disabled:opacity-60 transition-colors"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4 text-[#FBBF24]" />
        )}
        <span>Save Store Settings</span>
      </button>
    </form>
  );
}
