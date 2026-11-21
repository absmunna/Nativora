import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { Category } from '@/types';
import { deleteCategoryAdmin, saveCategoryAdmin } from '@/services/firebase/firestore';
import { generateSafeId, slugify } from '@/utils/format';
import { SLUG_REGEX, sanitizeImageUrl } from '@/utils/validation';
import { SafeImage } from '@/components/shared/SafeImage';
import { useCart } from '@/hooks/useCart';

interface AdminCategoriesPanelProps {
  categories: Category[];
}

interface CategoryFormState {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
}

export function AdminCategoriesPanel({ categories }: AdminCategoriesPanelProps) {
  const { showToast } = useCart();

  const [editing, setEditing] = useState<CategoryFormState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setError(null);
    setIsNew(true);
    setEditing({
      id: generateSafeId('cat'),
      name: '',
      slug: '',
      description: '',
      imageUrl: '/images/categories/category-002.webp',
      sortOrder: String(categories.length + 1),
      isActive: true,
    });
  };

  const openEdit = (cat: Category) => {
    setError(null);
    setIsNew(false);
    setEditing({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl,
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);

    const cleanSlug = slugify(editing.slug || editing.name);
    if (!SLUG_REGEX.test(cleanSlug) || cleanSlug.length < 2) {
      setError('Slug must use lowercase letters, numbers, and hyphens only.');
      return;
    }

    setSaving(true);
    try {
      await saveCategoryAdmin({
        id: editing.id,
        slug: cleanSlug,
        name: editing.name.trim(),
        description: editing.description.trim(),
        imageUrl: sanitizeImageUrl(editing.imageUrl),
        sortOrder: Math.max(0, Math.min(999, Number(editing.sortOrder) || 0)),
        isActive: editing.isActive,
      });
      showToast(isNew ? 'Category created' : 'Category updated');
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoryAdmin(id);
      setConfirmDeleteId(null);
      showToast('Category deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14241C]">
            Categories ({categories.length})
          </h2>
          <p className="text-xs text-[#4F6156]">
            Organize storefront collections with Hostinger SVG/image icon paths.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[40px] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#FBBF24]" />
          <span>Add Category</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
        >
          <div className="flex items-center justify-between border-b border-[#F0E2E7] pb-3">
            <h3 className="font-display text-lg font-semibold text-[#14241C]">
              {isNew ? 'New Category' : `Edit Category: ${editing.name}`}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: isNew ? slugify(e.target.value) : editing.slug,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">Slug *</label>
              <input
                type="text"
                required
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm font-mono min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
                Image URL *
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

          <div>
            <label className="block text-xs font-semibold text-[#14241C] mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
            />
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
              <span>{isNew ? 'Create Category' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-4 flex items-start gap-4 shadow-[0_2px_10px_-4px_rgba(20,36,28,0.06)]"
          >
            <div className="w-14 h-14 rounded-xl bg-[#FFF2F5] border border-[#E5D5DA] overflow-hidden shrink-0">
              <SafeImage src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                Order #{cat.sortOrder} · {cat.isActive ? 'Active' : 'Hidden'}
              </p>
              <h3 className="font-display text-base font-semibold text-[#14241C] truncate">
                {cat.name}
              </h3>
              <p className="text-xs text-[#4F6156] line-clamp-1 mt-0.5">{cat.description}</p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FAF4F6] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] rounded-lg cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {confirmDeleteId === cat.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(cat.id)}
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
