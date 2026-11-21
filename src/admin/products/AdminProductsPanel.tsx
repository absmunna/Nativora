import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Check, Loader2, X } from 'lucide-react';
import { Category, Product } from '@/types';
import { deleteProductAdmin, saveProductAdmin } from '@/services/firebase/firestore';
import { formatBDT, generateSafeId, slugify } from '@/utils/format';
import { SLUG_REGEX, sanitizeImageUrl } from '@/utils/validation';
import { SafeImage } from '@/components/shared/SafeImage';
import { useCart } from '@/hooks/useCart';

interface AdminProductsPanelProps {
  products: Product[];
  categories: Category[];
}

interface ProductFormState {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  origin: string;
  harvestBatch: string;
  shortNote: string;
  description: string;
  imageUrl: string;
  price: string;
  originalPrice: string;
  unitLabel: string;
  stock: string;
  isActive: boolean;
  featured: boolean;
  highlightsText: string;
}

function emptyProductForm(categories: Category[]): ProductFormState {
  const firstCat = categories[0];
  return {
    id: generateSafeId('prod'),
    name: '',
    slug: '',
    categoryId: firstCat?.id || 'cat-cold-pressed-oils',
    origin: '',
    harvestBatch: '',
    shortNote: '',
    description: '',
    imageUrl: '/images/products/product-001.webp',
    price: '500',
    originalPrice: '',
    unitLabel: '200g Glass Jar (২০০ গ্রাম)',
    stock: '25',
    isActive: true,
    featured: false,
    highlightsText: '',
  };
}

export function AdminProductsPanel({ products, categories }: AdminProductsPanelProps) {
  const { showToast } = useCart();

  const [editing, setEditing] = useState<ProductFormState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setError(null);
    setIsNew(true);
    setEditing(emptyProductForm(categories));
  };

  const openEdit = (p: Product) => {
    setError(null);
    setIsNew(false);
    setEditing({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      origin: p.origin || '',
      harvestBatch: p.harvestBatch || '',
      shortNote: p.shortNote || '',
      description: p.description || '',
      imageUrl: p.imageUrl,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      unitLabel: p.unitLabel,
      stock: String(p.stock),
      isActive: p.isActive,
      featured: Boolean(p.featured),
      highlightsText: (p.purityHighlights || []).join('\n'),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);

    const cleanSlug = slugify(editing.slug || editing.name);
    if (!SLUG_REGEX.test(cleanSlug) || cleanSlug.length < 2) {
      setError('Slug must use lowercase letters, numbers, and hyphens only (min 2 chars).');
      return;
    }

    const priceNum = Number(editing.price);
    const stockNum = Number(editing.stock);
    if (!Number.isFinite(priceNum) || priceNum < 1) {
      setError('Price must be at least ৳1.');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setError('Stock cannot be negative.');
      return;
    }

    const cat = categories.find((c) => c.id === editing.categoryId);
    const highlights = editing.highlightsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6);

    setSaving(true);
    try {
      await saveProductAdmin({
        id: editing.id,
        slug: cleanSlug,
        name: editing.name.trim(),
        categoryId: editing.categoryId,
        categoryName: cat?.name || 'Pantry',
        origin: editing.origin.trim(),
        harvestBatch: editing.harvestBatch.trim(),
        shortNote: editing.shortNote.trim(),
        description: editing.description.trim(),
        imageUrl: sanitizeImageUrl(editing.imageUrl),
        price: Math.round(priceNum),
        originalPrice: editing.originalPrice ? Math.round(Number(editing.originalPrice)) : 0,
        unitLabel: editing.unitLabel.trim(),
        stock: Math.round(stockNum),
        isActive: editing.isActive,
        featured: editing.featured,
        purityHighlights: highlights,
      });
      showToast(isNew ? 'Product created in Firestore' : 'Product updated');
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductAdmin(id);
      setConfirmDeleteId(null);
      showToast('Product deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCopyFbLink = async (slug: string) => {
    const link = `${window.location.origin}/?offer=${slug}&utm_source=facebook`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedSlug(slug);
      showToast('Facebook landing link copied');
      setTimeout(() => setCopiedSlug(null), 1800);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14241C]">
            Catalog Products ({products.length})
          </h2>
          <p className="text-xs text-[#4F6156]">
            Store Hostinger static image URLs (e.g.{' '}
            <code className="font-mono">/images/products/product-001.webp</code>) or HTTPS links.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[40px] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#FBBF24]" />
          <span>Add Product</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
        >
          <div className="flex items-center justify-between border-b border-[#F0E2E7] pb-3">
            <h3 className="font-display text-lg font-semibold text-[#14241C]">
              {isNew ? 'New Product' : `Edit: ${editing.name}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#4F6156] hover:text-[#164A31] cursor-pointer"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing({
                        ...editing,
                        name: val,
                        slug: isNew ? slugify(val) : editing.slug,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    URL Slug (Facebook Link) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                    placeholder="sundarban-raw-honey"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm font-mono min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Category *
                  </label>
                  <select
                    value={editing.categoryId}
                    onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.originalPrice}
                    onChange={(e) => setEditing({ ...editing, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Unit / Pack Size *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.unitLabel}
                    onChange={(e) => setEditing({ ...editing, unitLabel: e.target.value })}
                    placeholder="500g Glass Jar"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Stock Count *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editing.stock}
                    onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] tabular-nums focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={editing.origin}
                    onChange={(e) => setEditing({ ...editing, origin: e.target.value })}
                    placeholder="Satkhira / Pabna"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Image URL (Hostinger `/images/products/...` or HTTPS) *
                </label>
                <input
                  type="text"
                  required
                  value={editing.imageUrl}
                  onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                  placeholder="/images/products/product-001.webp"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm font-mono min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Short Note
                </label>
                <input
                  type="text"
                  value={editing.shortNote}
                  onChange={(e) => setEditing({ ...editing, shortNote: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Full Description
                </label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Purity Highlights (1 per line, up to 6)
                </label>
                <textarea
                  rows={2}
                  value={editing.highlightsText}
                  onChange={(e) => setEditing({ ...editing, highlightsText: e.target.value })}
                  placeholder="Cold-extracted without heating"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#14241C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#164A31]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#14241C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                    className="w-4 h-4 accent-[#164A31]"
                  />
                  <span>Featured Product</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-4 space-y-3">
              <p className="text-xs font-semibold text-[#14241C]">Image Preview</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-[#FFF2F5] border border-[#E5D5DA] p-2">
                <SafeImage
                  src={editing.imageUrl}
                  alt={editing.name || 'Preview'}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-[#4F6156] leading-relaxed">
                Upload image files to <code className="font-mono">public/images/products/</code>{' '}
                before running <code className="font-mono">npm run build</code> for Hostinger, or
                paste any public HTTPS image URL.
              </p>
            </div>
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isNew ? 'Create Product' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 flex gap-4 items-start shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FFF2F5] border border-[#E5D5DA] shrink-0 p-1">
              <SafeImage
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                    {product.categoryName} · {product.isActive ? 'Active' : 'Hidden'}
                  </p>
                  <h3 className="font-display text-base font-semibold text-[#14241C] truncate">
                    {product.name}
                  </h3>
                </div>
                <span className="font-semibold text-sm text-[#164A31] tabular-nums shrink-0">
                  {formatBDT(product.price)}
                </span>
              </div>

              <p className="text-xs text-[#4F6156] mt-1 tabular-nums">
                {product.unitLabel} · Stock: <strong>{product.stock}</strong>
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FAF4F6] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] rounded-lg cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyFbLink(product.slug)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FAF4F6] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] rounded-lg cursor-pointer transition-colors"
                >
                  {copiedSlug === product.slug ? (
                    <Check className="w-3.5 h-3.5 text-[#164A31]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#D97706]" />
                  )}
                  <span>{copiedSlug === product.slug ? 'Copied' : 'FB Link'}</span>
                </button>
                {confirmDeleteId === product.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(product.id)}
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
