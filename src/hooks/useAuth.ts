import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { CustomerProfile } from '@/types';

export interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminReason: string;
  customerProfile: CustomerProfile | null;
  refreshProfile: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  authReady: false,
  isAdmin: false,
  adminReason: 'none',
  customerProfile: null,
  refreshProfile: async () => {},
  refreshAdminStatus: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
