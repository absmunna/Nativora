import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { AuthContext } from '@/hooks/useAuth';
import { StoreCatalogContext } from '@/hooks/useStoreCatalog';
import { CartContext } from '@/hooks/useCart';
import {
  Banner,
  CartItem,
  Category,
  CustomerProfile,
  Product,
  StoreSettings,
} from '@/types';
import { testFirestoreConnection } from '@/services/firebase/firebaseConfig';
import { subscribeToAuth } from '@/services/firebase/auth';
import { checkIsAdminUser } from '@/services/firebase/adminAccess';
import {
  getCustomerProfile,
  subscribeBanners,
  subscribeCategories,
  subscribeProducts,
  subscribeSettings,
} from '@/services/firebase/firestore';
import {
  DEFAULT_BANNERS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
} from '@/services/firebase/seedData';
import {
  loadCartFromStorage,
  loadWishlistFromStorage,
  saveCartToStorage,
  saveWishlistToStorage,
} from '@/services/storage/localStorage';

export function AppProviders({ children }: { children: ReactNode }) {
  // 1. Auth & Customer Profile State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReason, setAdminReason] = useState('none');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);

  const loadUserMetadata = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminReason('none');
      setCustomerProfile(null);
      return;
    }

    const [adminRes, profileRes] = await Promise.allSettled([
      checkIsAdminUser(currentUser),
      getCustomerProfile(currentUser.uid),
    ]);

    if (adminRes.status === 'fulfilled') {
      setIsAdmin(adminRes.value.isAdmin);
      setAdminReason(adminRes.value.reason);
    } else {
      setIsAdmin(false);
      setAdminReason('none');
    }

    if (profileRes.status === 'fulfilled') {
      setCustomerProfile(profileRes.value);
    } else {
      setCustomerProfile(null);
    }
  }, []);

  useEffect(() => {
    void testFirestoreConnection();
    const unsub = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      void loadUserMetadata(currentUser);
    });
    return () => unsub();
  }, [loadUserMetadata]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getCustomerProfile(user.uid);
      setCustomerProfile(profile);
    } catch {
      // Ignore profile refresh errors if offline
    }
  }, [user]);

  const refreshAdminStatus = useCallback(async () => {
    const res = await checkIsAdminUser(user);
    setIsAdmin(res.isAdmin);
    setAdminReason(res.reason);
  }, [user]);

  // 2. Store Catalog State (Firestore Real-Time with Starter Fallback)
  const [liveProducts, setLiveProducts] = useState<Product[] | null>(null);
  const [liveCategories, setLiveCategories] = useState<Category[] | null>(null);
  const [liveBanners, setLiveBanners] = useState<Banner[] | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let prodDone = false;
    let catDone = false;
    const markReady = () => {
      if (prodDone && catDone) setLoadingCatalog(false);
    };

    const unsubProd = subscribeProducts(
      (items) => {
        setLiveProducts(items);
        prodDone = true;
        markReady();
      },
      (err) => {
        setCatalogError(err.message);
        prodDone = true;
        markReady();
      },
    );

    const unsubCat = subscribeCategories(
      (items) => {
        setLiveCategories(items);
        catDone = true;
        markReady();
      },
      (err) => {
        setCatalogError(err.message);
        catDone = true;
        markReady();
      },
    );

    const unsubBanner = subscribeBanners(
      (items) => setLiveBanners(items),
      () => {},
    );

    const unsubSettings = subscribeSettings(
      (s) => setSettings(s),
      () => {},
    );

    return () => {
      unsubProd();
      unsubCat();
      unsubBanner();
      unsubSettings();
    };
  }, []);

  const isUsingFallbackData = useMemo(
    () => !loadingCatalog && (liveProducts === null || liveProducts.length === 0),
    [loadingCatalog, liveProducts],
  );

  const products = useMemo(
    () => (liveProducts && liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS),
    [liveProducts],
  );

  const categories = useMemo(
    () => (liveCategories && liveCategories.length > 0 ? liveCategories : DEFAULT_CATEGORIES),
    [liveCategories],
  );

  const banners = useMemo(
    () => (liveBanners && liveBanners.length > 0 ? liveBanners : DEFAULT_BANNERS),
    [liveBanners],
  );

  // 3. Cart, Wishlist & Toast State
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadWishlistFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  useEffect(() => {
    saveWishlistToStorage(wishlistIds);
  }, [wishlistIds]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const qty = Math.max(1, Math.min(50, quantity));
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            displayPrice: product.price,
            quantity: Math.min(50, next[idx].quantity + qty),
          };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            unitLabel: product.unitLabel,
            imageUrl: product.imageUrl,
            displayPrice: product.price,
            quantity: qty,
          },
        ];
      });
      showToast(`Added ${product.name} to bag`);
    },
    [showToast],
  );

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(50, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        showToast(exists ? 'Removed from saved list' : 'Saved to wishlist');
        return next;
      });
    },
    [showToast],
  );

  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const estimatedSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.displayPrice * item.quantity, 0),
    [items],
  );

  const authValue = useMemo(
    () => ({
      user,
      authReady,
      isAdmin,
      adminReason,
      customerProfile,
      refreshProfile,
      refreshAdminStatus,
    }),
    [user, authReady, isAdmin, adminReason, customerProfile, refreshProfile, refreshAdminStatus],
  );

  const catalogValue = useMemo(
    () => ({
      products,
      categories,
      banners,
      settings,
      isUsingFallbackData,
      loading: loadingCatalog,
      catalogError,
    }),
    [products, categories, banners, settings, isUsingFallbackData, loadingCatalog, catalogError],
  );

  const cartValue = useMemo(
    () => ({
      items,
      wishlistIds,
      totalCount,
      estimatedSubtotal,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      toggleWishlist,
      showToast,
    }),
    [
      items,
      wishlistIds,
      totalCount,
      estimatedSubtotal,
      isCartOpen,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      toggleWishlist,
      showToast,
    ],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <StoreCatalogContext.Provider value={catalogValue}>
        <CartContext.Provider value={cartValue}>
          {children}
          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 bg-[#164A31] text-white text-xs font-medium rounded-xl shadow-lg border border-[#246344] max-w-xs"
            >
              {toastMessage}
            </div>
          )}
        </CartContext.Provider>
      </StoreCatalogContext.Provider>
    </AuthContext.Provider>
  );
}
