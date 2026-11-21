import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase/firebaseConfig';
import {
  Banner,
  Category,
  CustomerProfile,
  DeliveryZone,
  OrderItemRequest,
  OrderRecord,
  OrderSource,
  OrderStatus,
  Product,
  ProductReview,
  StoreSettings,
} from '@/types';
import { estimateDeliveryFee, generateOrderCode, generateSafeId } from '@/utils/format';
import { sanitizeImageUrl } from '@/utils/validation';
import {
  DEFAULT_BANNERS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
} from '@/services/firebase/seedData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------------------------------------------------------------------
// Real-time Catalog Subscriptions
// ---------------------------------------------------------------------------
export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Product);
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'categories';
  const q = query(collection(db, path), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Category);
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export function subscribeBanners(
  onData: (banners: Banner[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'banners';
  const q = query(collection(db, path), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Banner);
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export function subscribeSettings(
  onData: (settings: StoreSettings) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'settings/store';
  return onSnapshot(
    doc(db, 'settings', 'store'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as StoreSettings);
      } else {
        onData(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Customer Profile (UID-keyed, Strictly Private)
// ---------------------------------------------------------------------------
export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const path = `customers/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'customers', uid));
    return snap.exists() ? (snap.data() as CustomerProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertCustomerProfile(input: {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  zone: DeliveryZone;
  isAnonymous: boolean;
}): Promise<void> {
  const path = `customers/${input.uid}`;
  const docRef = doc(db, 'customers', input.uid);

  try {
    const existingSnap = await getDoc(docRef);
    const payload = {
      uid: input.uid,
      name: input.name.trim().slice(0, 120),
      phone: input.phone.trim().slice(0, 20),
      email: (input.email ?? '').trim().slice(0, 140),
      address: input.address.trim().slice(0, 300),
      zone: input.zone,
      isAnonymous: input.isAnonymous,
      updatedAt: serverTimestamp(),
      ...(existingSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    };

    if (existingSnap.exists()) {
      await setDoc(docRef, payload, { merge: true });
    } else {
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// Customer Orders (COD Pending Requests Only - Zero Client Price/Stock Trust)
// ---------------------------------------------------------------------------
export async function createPendingCodOrder(input: {
  customerUid: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  deliveryZone: DeliveryZone;
  source: OrderSource;
  campaignSlug?: string;
  notes?: string;
  items: OrderItemRequest[];
}): Promise<{ id: string; orderCode: string }> {
  const orderId = generateSafeId('ord');
  const orderCode = generateOrderCode();
  const path = `orders/${orderId}`;

  // Cleanse items: store productId, productName, unitLabel, quantity.
  // Never store client-trusted totals as verified!
  const sanitizedItems = input.items.slice(0, 20).map((item) => ({
    productId: item.productId.slice(0, 128),
    productName: item.productName.slice(0, 140),
    unitLabel: item.unitLabel.slice(0, 60),
    quantity: Math.max(1, Math.min(50, Math.round(item.quantity))),
  }));

  try {
    await setDoc(doc(db, 'orders', orderId), {
      orderCode,
      customerUid: input.customerUid,
      customerName: input.customerName.trim().slice(0, 120),
      customerPhone: input.customerPhone.trim().slice(0, 20),
      customerEmail: (input.customerEmail ?? '').trim().slice(0, 140),
      customerAddress: input.customerAddress.trim().slice(0, 300),
      deliveryZone: input.deliveryZone,
      paymentMethod: 'COD',
      status: 'pending_verification',
      pricingVerified: false,
      verifiedSubtotal: 0,
      verifiedDeliveryFee: 0,
      verifiedTotal: 0,
      stockDeducted: false,
      source: input.source,
      campaignSlug: (input.campaignSlug ?? '').trim().slice(0, 120),
      notes: (input.notes ?? '').trim().slice(0, 400),
      items: sanitizedItems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: orderId, orderCode };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeCustomerOrders(
  customerUid: string,
  onData: (orders: OrderRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('customerUid', '==', customerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs
        .map((d) => ({
          ...(d.data() as Omit<OrderRecord, 'id'>),
          id: d.id,
        }))
        .sort((a, b) => {
          const tA =
            typeof a.createdAt === 'object' && a.createdAt && 'toMillis' in a.createdAt
              ? (a.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          const tB =
            typeof b.createdAt === 'object' && b.createdAt && 'toMillis' in b.createdAt
              ? (b.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          return tB - tA;
        });
      onData(orders);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function cancelPendingOrderCustomer(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await setDoc(
      doc(db, 'orders', orderId),
      {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Customer Product Reviews (Public Read, Authenticated Author Write/Delete)
// ---------------------------------------------------------------------------
export function subscribeProductReviews(
  productId: string,
  onData: (reviews: ProductReview[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'reviews';
  const q = query(collection(db, path), where('productId', '==', productId));
  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs
        .map((d) => ({
          ...(d.data() as Omit<ProductReview, 'id'>),
          id: d.id,
        }))
        .sort((a, b) => {
          const tA =
            typeof a.createdAt === 'object' && a.createdAt && 'toMillis' in a.createdAt
              ? (a.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          const tB =
            typeof b.createdAt === 'object' && b.createdAt && 'toMillis' in b.createdAt
              ? (b.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          return tB - tA;
        });
      onData(reviews);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export async function createProductReview(input: {
  productId: string;
  authorUid: string;
  reviewerName: string;
  rating: number;
  comment: string;
}): Promise<{ id: string }> {
  const reviewId = generateSafeId('rev');
  const path = `reviews/${reviewId}`;
  const reviewerName = input.reviewerName.trim().slice(0, 80);
  const comment = input.comment.trim().slice(0, 600);
  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5)));

  if (reviewerName.length < 2) {
    throw new Error('Please enter your name (at least 2 characters).');
  }
  if (comment.length < 3) {
    throw new Error('Please write a short review (at least 3 characters).');
  }

  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      id: reviewId,
      productId: input.productId.slice(0, 128),
      authorUid: input.authorUid.slice(0, 128),
      reviewerName,
      rating,
      comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: reviewId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteProductReview(reviewId: string): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Admin Operations (Catalog, Banners, Settings, Customers, Order Verification)
// ---------------------------------------------------------------------------
export async function saveProductAdmin(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `products/${product.id}`;
  const docRef = doc(db, 'products', product.id);
  try {
    const snap = await getDoc(docRef);
    const payload = {
      id: product.id,
      slug: product.slug.trim().slice(0, 120),
      name: product.name.trim().slice(0, 140),
      categoryId: product.categoryId,
      categoryName: product.categoryName.trim().slice(0, 80),
      origin: (product.origin ?? '').trim().slice(0, 120),
      harvestBatch: (product.harvestBatch ?? '').trim().slice(0, 100),
      shortNote: (product.shortNote ?? '').trim().slice(0, 220),
      description: (product.description ?? '').trim().slice(0, 1600),
      imageUrl: sanitizeImageUrl(product.imageUrl),
      price: Math.max(1, Number(product.price) || 1),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : 0,
      unitLabel: product.unitLabel.trim().slice(0, 60),
      stock: Math.max(0, Math.round(Number(product.stock) || 0)),
      isActive: Boolean(product.isActive),
      featured: Boolean(product.featured),
      rating: Number(product.rating ?? 4.9),
      reviewCount: Number(product.reviewCount ?? 0),
      purityHighlights: (product.purityHighlights ?? []).slice(0, 6),
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    };

    if (snap.exists()) {
      await setDoc(docRef, payload, { merge: true });
    } else {
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryAdmin(
  category: Omit<Category, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const path = `categories/${category.id}`;
  const docRef = doc(db, 'categories', category.id);
  try {
    const snap = await getDoc(docRef);
    const payload = {
      id: category.id,
      slug: category.slug.trim().slice(0, 100),
      name: category.name.trim().slice(0, 80),
      description: (category.description ?? '').trim().slice(0, 300),
      imageUrl: sanitizeImageUrl(category.imageUrl),
      sortOrder: Math.max(0, Number(category.sortOrder) || 0),
      isActive: Boolean(category.isActive),
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    };
    if (snap.exists()) {
      await setDoc(docRef, payload, { merge: true });
    } else {
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryAdmin(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBannerAdmin(banner: Omit<Banner, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `banners/${banner.id}`;
  const docRef = doc(db, 'banners', banner.id);
  try {
    const snap = await getDoc(docRef);
    const payload = {
      id: banner.id,
      title: banner.title.trim().slice(0, 140),
      subtitle: (banner.subtitle ?? '').trim().slice(0, 280),
      imageUrl: sanitizeImageUrl(banner.imageUrl),
      ctaLabel: (banner.ctaLabel ?? 'Shop Now').trim().slice(0, 50),
      targetSlug: (banner.targetSlug ?? '').trim().slice(0, 120),
      isActive: Boolean(banner.isActive),
      sortOrder: Math.max(0, Number(banner.sortOrder) || 1),
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    };
    if (snap.exists()) {
      await setDoc(docRef, payload, { merge: true });
    } else {
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBannerAdmin(bannerId: string): Promise<void> {
  const path = `banners/${bannerId}`;
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSettingsAdmin(settings: Omit<StoreSettings, 'updatedAt'>): Promise<void> {
  const path = `settings/${settings.id}`;
  try {
    await setDoc(doc(db, 'settings', settings.id), {
      id: settings.id,
      storeName: settings.storeName.trim().slice(0, 80),
      tagline: (settings.tagline ?? '').trim().slice(0, 180),
      hotline: (settings.hotline ?? '').trim().slice(0, 30),
      supportEmail: (settings.supportEmail ?? '').trim().slice(0, 140),
      insideDhakaFee: Math.max(0, Number(settings.insideDhakaFee) || 0),
      suburbDhakaFee: Math.max(0, Number(settings.suburbDhakaFee) || 0),
      outsideDhakaFee: Math.max(0, Number(settings.outsideDhakaFee) || 0),
      freeDeliveryThreshold: Math.max(0, Number(settings.freeDeliveryThreshold) || 0),
      promoNotice: (settings.promoNotice ?? '').trim().slice(0, 180),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeAllOrdersAdmin(
  onData: (orders: OrderRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<OrderRecord, 'id'>),
        id: d.id,
      }));
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

export function subscribeAllCustomersAdmin(
  onData: (customers: CustomerProfile[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'customers';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as CustomerProfile);
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },
  );
}

/**
 * Admin verifies live product prices and stock from Firestore inside an atomic
 * transaction before deducting stock and marking the COD order as confirmed.
 */
export async function verifyAndConfirmOrderAdmin(
  orderId: string,
  adminUid: string,
  settings: StoreSettings,
): Promise<{ verifiedSubtotal: number; verifiedDeliveryFee: number; verifiedTotal: number }> {
  const orderPath = `orders/${orderId}`;
  try {
    return await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order record not found.');
      }

      const order = orderSnap.data() as OrderRecord;
      if (order.status !== 'pending_verification') {
        throw new Error(`Order is already "${order.status}" and cannot be re-verified.`);
      }

      const productSnaps = await Promise.all(
        order.items.map((item) => tx.get(doc(db, 'products', item.productId))),
      );

      let verifiedSubtotal = 0;
      const verifiedItems: OrderItemRequest[] = [];
      const stockUpdates: Array<{ ref: ReturnType<typeof doc>; newStock: number }> = [];

      for (let idx = 0; idx < order.items.length; idx++) {
        const reqItem = order.items[idx];
        const prodSnap = productSnaps[idx];
        if (!prodSnap.exists()) {
          throw new Error(`Product "${reqItem.productName}" no longer exists in catalog.`);
        }
        const prod = prodSnap.data() as Product;
        if (!prod.isActive) {
          throw new Error(`Product "${prod.name}" is currently inactive.`);
        }
        if (prod.stock < reqItem.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${reqItem.quantity}.`,
          );
        }

        verifiedSubtotal += prod.price * reqItem.quantity;
        verifiedItems.push({
          productId: prod.id,
          productName: prod.name,
          unitLabel: prod.unitLabel,
          quantity: reqItem.quantity,
          verifiedUnitPrice: prod.price,
        });

        stockUpdates.push({
          ref: doc(db, 'products', prod.id),
          newStock: prod.stock - reqItem.quantity,
        });
      }

      const verifiedDeliveryFee = estimateDeliveryFee(
        verifiedSubtotal,
        order.deliveryZone,
        settings,
      );
      const verifiedTotal = verifiedSubtotal + verifiedDeliveryFee;

      for (const upd of stockUpdates) {
        tx.update(upd.ref, {
          stock: upd.newStock,
          updatedAt: serverTimestamp(),
        });
      }

      tx.update(orderRef, {
        status: 'confirmed',
        pricingVerified: true,
        stockDeducted: true,
        verifiedSubtotal,
        verifiedDeliveryFee,
        verifiedTotal,
        verifiedByUid: adminUid,
        items: verifiedItems,
        updatedAt: serverTimestamp(),
      });

      return { verifiedSubtotal, verifiedDeliveryFee, verifiedTotal };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, orderPath);
  }
}

export async function updateOrderStatusAdmin(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await setDoc(
      doc(db, 'orders', orderId),
      {
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedInitialCatalogAdmin(): Promise<void> {
  const path = 'products';
  try {
    const [existingProds, existingCats, existingBanners] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'banners')),
    ]);

    const existingProdMap = new Map(existingProds.docs.map((d) => [d.id, d.data()]));
    const existingCatMap = new Map(existingCats.docs.map((d) => [d.id, d.data()]));
    const existingBannerMap = new Map(existingBanners.docs.map((d) => [d.id, d.data()]));

    const deprecatedIds = new Set([
      'prod-sundarban-honey',
      'prod-kalojira-honey',
      'prod-mustard-oil',
      'prod-coconut-oil',
      'prod-pure-spices',
      'prod-desi-ghee',
      'prod-chia-pantry',
      'cat-raw-honey',
      'cat-ghee-pantry',
    ]);

    const batch = writeBatch(db);

    for (const d of existingProds.docs) {
      if (deprecatedIds.has(d.id)) {
        batch.delete(doc(db, 'products', d.id));
      }
    }
    for (const d of existingCats.docs) {
      if (deprecatedIds.has(d.id)) {
        batch.delete(doc(db, 'categories', d.id));
      }
    }

    for (const cat of DEFAULT_CATEGORIES) {
      const prev = existingCatMap.get(cat.id);
      batch.set(doc(db, 'categories', cat.id), {
        ...cat,
        createdAt: prev?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const banner of DEFAULT_BANNERS) {
      const prev = existingBannerMap.get(banner.id);
      batch.set(doc(db, 'banners', banner.id), {
        ...banner,
        createdAt: prev?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'settings', DEFAULT_SETTINGS.id), {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    for (const product of DEFAULT_PRODUCTS) {
      const prev = existingProdMap.get(product.id);
      batch.set(doc(db, 'products', product.id), {
        ...product,
        createdAt: prev?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
