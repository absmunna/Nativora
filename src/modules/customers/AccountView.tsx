import { useState, useEffect } from 'react';
import { User, LogOut, Save, Loader2, Shield } from 'lucide-react';
import { AppRoute, DeliveryZone } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  formatFirebaseAuthError,
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  signInAsGuest,
} from '@/services/firebase/auth';
import { upsertCustomerProfile } from '@/services/firebase/firestore';
import { validateCustomerFields } from '@/utils/validation';
import { useCart } from '@/hooks/useCart';

interface AccountViewProps {
  onNavigate: (route: AppRoute) => void;
}

const ZONES: DeliveryZone[] = ['Inside Dhaka', 'Dhaka Suburbs', 'Outside Dhaka'];

export function AccountView({ onNavigate }: AccountViewProps) {
  const { user, isAdmin, customerProfile, refreshProfile } = useAuth();
  const { showToast } = useCart();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<DeliveryZone>('Inside Dhaka');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name);
      setPhone(customerProfile.phone);
      setEmail(customerProfile.email || user?.email || '');
      setAddress(customerProfile.address);
      setZone(customerProfile.zone);
    } else if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [customerProfile, user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(authEmail, authPassword);
        showToast('Signed in successfully');
      } else {
        await registerWithEmail(authEmail, authPassword, authName);
        showToast('Account created');
      }
      setAuthPassword('');
    } catch (err: unknown) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInAsGuest();
      showToast('Guest session active');
    } catch (err: unknown) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileError(null);

    const validationError = validateCustomerFields({ name, phone, email, address, zone });
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setSavingProfile(true);
    try {
      await upsertCustomerProfile({
        uid: user.uid,
        name,
        phone,
        email,
        address,
        zone,
        isAnonymous: user.isAnonymous,
      });
      await refreshProfile();
      showToast('Customer profile saved');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309] mb-1">
          Customer Identity
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14241C]">
          Account &amp; Delivery Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Auth Card */}
        <div className="md:col-span-5 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-6 space-y-5 h-fit shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F5E6EC] border border-[#E5D5DA] text-[#164A31] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#14241C] truncate">
                    {user.isAnonymous ? 'Guest Session' : user.email}
                  </p>
                  <p className="font-mono text-[11px] text-[#4F6156] truncate">
                    UID: {user.uid}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'admin' })}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FDF6E7] border border-[#F2D399] hover:bg-[#F9EBCA] text-[#92400E] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Open Admin Portal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => logoutCurrentUser()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-[#E5D5DA] hover:border-[#164A31] text-xs font-semibold text-[#164A31] rounded-xl cursor-pointer min-h-[44px] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : null}

          {(!user || user.isAnonymous) && (
            <div className={user?.isAnonymous ? 'pt-4 border-t border-[#F0E2E7] space-y-4' : 'space-y-4'}>
              <div className="flex gap-1.5 p-1 bg-[#FAF4F6] border border-[#E5D5DA] rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    mode === 'login' ? 'bg-[#FFF6F9] text-[#164A31] shadow-xs border border-[#E5D5DA]/60' : 'text-[#4F6156]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    mode === 'register' ? 'bg-[#FFF6F9] text-[#164A31] shadow-xs border border-[#E5D5DA]/60' : 'text-[#4F6156]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {mode === 'register' && (
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                )}
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#164A31] hover:bg-[#103825] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[44px] disabled:opacity-60 transition-colors"
                >
                  {authLoading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign In with Email'
                      : 'Register with Email'}
                </button>
              </form>

              {!user && (
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 border border-[#E5D5DA] hover:border-[#164A31] text-xs font-medium text-[#164A31] rounded-xl cursor-pointer min-h-[44px] transition-colors"
                >
                  Continue as Guest (Anonymous)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Private Customer Profile Form */}
        <div className="md:col-span-7 bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          <div className="pb-3 border-b border-[#F0E2E7] mb-5">
            <h2 className="font-display text-xl font-semibold text-[#14241C] mb-1">
              Saved Delivery Details
            </h2>
            <p className="text-xs text-[#4F6156]">
              Stored privately under your Firebase UID. Never shared or merged by unverified phone
              numbers.
            </p>
          </div>

          {!user ? (
            <p className="text-sm text-[#4F6156] py-8 text-center">
              Sign in with Email/Password or start a Guest session to save your delivery profile.
            </p>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prof-name" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prof-email" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="prof-zone" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                    Default Delivery Zone
                  </label>
                  <select
                    id="prof-zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value as DeliveryZone)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prof-address" className="block text-xs font-semibold text-[#14241C] mb-1.5">
                  Delivery Address *
                </label>
                <textarea
                  id="prof-address"
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] disabled:opacity-60 transition-colors"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-[#FBBF24]" />
                )}
                <span>Save Delivery Profile</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
