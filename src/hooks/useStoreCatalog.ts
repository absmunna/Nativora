import { createContext, useContext } from 'react';
import { Banner, Category, Product, StoreSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/services/firebase/seedData';

export interface StoreCatalogContextValue {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings;
  isUsingFallbackData: boolean;
  loading: boolean;
  catalogError: string | null;
}

export const StoreCatalogContext = createContext<StoreCatalogContextValue>({
  products: [],
  categories: [],
  banners: [],
  settings: DEFAULT_SETTINGS,
  isUsingFallbackData: false,
  loading: true,
  catalogError: null,
});

export function useStoreCatalog(): StoreCatalogContextValue {
  return useContext(StoreCatalogContext);
}
