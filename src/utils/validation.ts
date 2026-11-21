import { DeliveryZone } from '@/types';

export const PHONE_REGEX = /^[0-9+\-\s]{7,20}$/;
export const SLUG_REGEX = /^[a-z0-9-]+$/;
export const DOC_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export interface CustomerFormInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  zone: DeliveryZone;
}

export function validateCustomerFields(input: CustomerFormInput): string | null {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = (input.email ?? '').trim();
  const address = input.address.trim();

  if (name.length < 2 || name.length > 120) {
    return 'Full name must be between 2 and 120 characters.';
  }
  if (!PHONE_REGEX.test(phone)) {
    return 'Enter a valid Bangladeshi phone number (7–20 digits, e.g. 017XXXXXXXX).';
  }
  if (email.length > 140) {
    return 'Email address must be 140 characters or fewer.';
  }
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address or leave email blank.';
  }
  if (address.length < 5 || address.length > 300) {
    return 'Delivery address must be between 5 and 300 characters.';
  }
  if (!['Inside Dhaka', 'Dhaka Suburbs', 'Outside Dhaka'].includes(input.zone)) {
    return 'Please select a valid delivery zone.';
  }
  return null;
}

export function sanitizeImageUrl(url: string): string {
  const clean = url.trim().slice(0, 500);
  if (!clean) return '/images/products/product-001.webp';
  if (clean.startsWith('/') || clean.startsWith('https://') || clean.startsWith('http://')) {
    return clean;
  }
  return `/${clean}`;
}
