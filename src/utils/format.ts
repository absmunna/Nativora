import { DeliveryZone, OrderStatus, StoreSettings } from '@/types';

export function formatBDT(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `৳${safe.toLocaleString('en-BD')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function generateOrderCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `NTV-${num}`;
}

export function estimateDeliveryFee(
  subtotal: number,
  zone: DeliveryZone,
  settings: StoreSettings,
): number {
  if (subtotal >= settings.freeDeliveryThreshold) {
    return 0;
  }
  if (zone === 'Inside Dhaka') return settings.insideDhakaFee;
  if (zone === 'Dhaka Suburbs') return settings.suburbDhakaFee;
  return settings.outsideDhakaFee;
}

export function formatOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending_verification':
      return 'Pending Verification';
    case 'confirmed':
      return 'Confirmed';
    case 'dispatched':
      return 'Dispatched';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function formatTimestamp(value: unknown): string {
  if (!value) return 'Just now';
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const fn = (value as { toDate: () => Date }).toDate;
    if (typeof fn === 'function') {
      return fn().toLocaleString();
    }
  }
  return 'Just now';
}
