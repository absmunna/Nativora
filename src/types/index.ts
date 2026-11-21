import { Timestamp } from 'firebase/firestore';

export type DeliveryZone = 'Inside Dhaka' | 'Dhaka Suburbs' | 'Outside Dhaka';

export type OrderStatus =
  | 'pending_verification'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type OrderSource = 'storefront' | 'facebook_landing';

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  origin?: string;
  harvestBatch?: string;
  shortNote?: string;
  description?: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  unitLabel: string;
  stock: number;
  isActive: boolean;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  purityHighlights?: string[];
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface CustomerProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  zone: DeliveryZone;
  isAnonymous: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface OrderItemRequest {
  productId: string;
  productName: string;
  unitLabel: string;
  quantity: number;
  claimedUnitPrice?: number;
  verifiedUnitPrice?: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  deliveryZone: DeliveryZone;
  paymentMethod: 'COD';
  status: OrderStatus;
  pricingVerified: boolean;
  verifiedSubtotal: number;
  verifiedDeliveryFee: number;
  verifiedTotal: number;
  stockDeducted: boolean;
  verifiedByUid?: string;
  source: OrderSource;
  campaignSlug?: string;
  notes?: string;
  items: OrderItemRequest[];
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  targetSlug?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline?: string;
  hotline?: string;
  supportEmail?: string;
  insideDhakaFee: number;
  suburbDhakaFee: number;
  outsideDhakaFee: number;
  freeDeliveryThreshold: number;
  promoNotice?: string;
  updatedAt?: Timestamp | string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  unitLabel: string;
  imageUrl: string;
  displayPrice: number;
  quantity: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorUid: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export type AppRoute =
  | { view: 'home' }
  | { view: 'product'; slug: string; fromFacebook?: boolean }
  | { view: 'checkout' }
  | { view: 'orders' }
  | { view: 'account' }
  | { view: 'admin'; tab?: string };
