import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { Banner, Product } from '@/types';
import { deleteBannerAdmin, saveBannerAdmin } from '@/services/firebase/firestore';
import { generateSafeId } from '@/utils/format';
import { sanitizeImageUrl } from '@/utils/validation';
import { SafeImage } from '@/components/shared/SafeImage';
import { useCart } from '@/hooks/useCart';

interface AdminBannersPanelProps {
  banners: Banner[];
  products: Product[];
}

interface BannerFormState {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  targetSlug: string;
  isActive: boolean;
  sortOrder: string;
}

export function AdminBannersPanel({ banners, products }: AdminBannersPanelProps) {
  const { showToast } = useCart();

  const [editing, setEditing] = useState<BannerFormState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setError(null);
    setIsNew(true);
    setEditing({
      id: generateSafeId('banner'),
      title: '',
      subtitle: '',
      imageUrl: '/images/banners/banner-001.webp',
      ctaLabel: 'Shop Nativora Pantry',
      targetSlug: products[0]?.slug || '',
      isActive: true,
      sortOrder: String(banners.length + 1),
    });
  };

  const openEdit = (b: Banner) => {
    setError(null);
    setIsNew(false);
    setEditing({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl,
      ctaLabel: b.ctaLabel || 'Shop Now',
      targetSlug: b.targetSlug || '',
      isActive: b.isActive,
      sortOrder: String(b.sortOrder),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);

    if (editing.title.trim().length < 2) {
      setError('Banner title must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      await saveBannerAdmin({
        id: editing.id,
        title: editing.title.trim(),
        subtitle: editing.subtitle.trim(),
        imageUrl: sanitizeImageUrl(editing.imageUrl),
        ctaLabel: editing.ctaLabel.trim() || 'Shop Now',
        targetSlug: editing.targetSlug.trim(),
        isActive: editing.isActive,
        sortOrder: Math.max(0, Math.min(999, Number(editing.sortOrder) || 1)),
      });
      showToast(isNew ? 'Banner created' : 'Banner updated');
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBannerAdmin(id);
      setConfirmDeleteId(null);
      showToast('Banner deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14241C]">
            Hero Banners ({banners.length})
          </h2>
          <p className="text-xs text-[#4F6156]">
            Manage storefront hero banners using Hostinger{' '}
            <code className="font-mono">/images/banners/...</code> paths or HTTPS URLs.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[40px] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#FBBF24]" />
          <span>Add Banner</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
        >
          <div className="flex items-center justify-between border-b border-[#F0E2E7] pb-3">
            <h3 className="font-display text-lg font-semibold text-[#14241C]">
              {isNew ? 'New Banner' : `Edit Banner: ${editing.title}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#4F6156] hover:text-[#164A31] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
              Headline Title *
            </label>
            <input
              type="text"
              required
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Subtitle</label>
            <textarea
              rows={2}
              value={editing.subtitle}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Banner Image URL *
              </label>
              <input
                type="text"
                required
                value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm font-mono min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Featured Product Slug (Quick COD Button)
              </label>
              <select
                value={editing.targetSlug}
                onChange={(e) => setEditing({ ...editing, targetSlug: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              >
                <option value="">None</option>
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} ({p.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Primary CTA Label
              </label>
              <input
                type="text"
                value={editing.ctaLabel}
                onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                min={0}
                max={999}
                value={editing.sortOrder}
                onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#14241C] cursor-pointer">
            <input
              type="checkbox"
              checked={editing.isActive}
              onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              className="w-4 h-4 accent-[#164A31]"
            />
            <span>Active on Storefront</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#F0E2E7]">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 bg-[#FFF6F9] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isNew ? 'Create Banner' : 'Save Banner'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]"
          >
            <div className="w-full sm:w-44 aspect-[16/10] rounded-xl overflow-hidden bg-[#FFF2F5] border border-[#E5D5DA] shrink-0">
              <SafeImage
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                Sort #{banner.sortOrder} · {banner.isActive ? 'Active' : 'Hidden'}
              </p>
              <h3 className="font-display text-lg font-semibold text-[#14241C]">
                {banner.title}
              </h3>
              <p className="text-xs text-[#4F6156] line-clamp-2 mt-1">{banner.subtitle}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => openEdit(banner)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FAF4F6] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] rounded-lg cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {confirmDeleteId === banner.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(banner.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
