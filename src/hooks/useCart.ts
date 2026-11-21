import { createContext, useContext } from 'react';
import { CartItem, Product } from '@/types';

export interface CartContextValue {
  items: CartItem[];
  wishlistIds: string[];
  totalCount: number;
  estimatedSubtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  showToast: (msg: string) => void;
}

export const CartContext = createContext<CartContextValue>({
  items: [],
  wishlistIds: [],
  totalCount: 0,
  estimatedSubtotal: 0,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  toggleWishlist: () => {},
  showToast: () => {},
});

export function useCart(): CartContextValue {
  return useContext(CartContext);
}
