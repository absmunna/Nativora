import { useState } from 'react';
import { Lock, Copy, Check, LogOut, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import {
  formatFirebaseAuthError,
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
} from '@/services/firebase/auth';

export function AdminLoginGate() {
  const { user, refreshAdminStatus } = useAuth();
  const { showToast } = useCart();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUid, setCheckingUid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        showToast('Signed in — checking Admin UID permissions');
      } else {
        await registerWithEmail(email, password, name);
        showToast('Account created — copy your UID below to grant Admin access');
      }
      setPassword('');
      await refreshAdminStatus();
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      showToast('Firebase UID copied');
      setTimeout(() => setCopiedUid(false), 1800);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleRecheck = async () => {
    setCheckingUid(true);
    try {
      await refreshAdminStatus();
      showToast('Admin status re-checked');
    } finally {
      setCheckingUid(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FFF6F9] border border-[#E5D5DA] p-1 flex items-center justify-center shrink-0">
            <img
              src="/images/logo/nativora-logo.webp"
              alt="Nativora™"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
              Restricted Access
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#14241C]">
              Nativora Admin Portal
            </h1>
            <p className="text-xs text-[#4F6156] mt-1 leading-relaxed">
              Admin privileges are restricted by Firebase UID in Firestore Security Rules under the
              Spark Plan (no custom backend server required).
            </p>
          </div>
        </div>

        {user && !user.isAnonymous ? (
          <div className="p-4 rounded-xl bg-[#FAF4F6] border border-[#E5D5DA] space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-[#92400E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
              <div>
                <p className="font-semibold text-[#14241C]">
                  Signed in as {user.email}, but this UID is not authorized as Admin yet.
                </p>
                <p className="text-[#4F6156] mt-1 leading-relaxed">
                  To authorize this account under Spark Plan Security Rules, create a document at{' '}
                  <code className="font-mono bg-[#FFF6F9] px-1.5 py-0.5 rounded border border-[#E5D5DA]">
                    admins/{user.uid}
                  </code>{' '}
                  in Firebase Console Firestore with fields{' '}
                  <code className="font-mono bg-[#FFF6F9] px-1.5 py-0.5 rounded border border-[#E5D5DA]">
                    uid
                  </code>{' '}
                  and{' '}
                  <code className="font-mono bg-[#FFF6F9] px-1.5 py-0.5 rounded border border-[#E5D5DA]">
                    role: &quot;admin&quot;
                  </code>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-[#FFF6F9] border border-[#E5D5DA] rounded-xl px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-[#4F6156] font-medium">
                  Your Firebase UID
                </p>
                <p className="font-mono text-xs text-[#14241C] truncate">{user.uid}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyUid}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#164A31] hover:bg-[#103825] text-white rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleRecheck}
                disabled={checkingUid}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl cursor-pointer min-h-[40px] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingUid ? 'animate-spin' : ''}`} />
                <span>Re-check Admin Access</span>
              </button>
              <button
                type="button"
                onClick={() => logoutCurrentUser()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FFF6F9] border border-[#E5D5DA] hover:border-[#164A31] text-[#164A31] text-xs font-semibold rounded-xl cursor-pointer min-h-[40px] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : null}

        {(!user || user.isAnonymous) && (
          <div className="space-y-4">
            {user?.isAnonymous && (
              <div className="p-3 rounded-xl bg-[#FDF6E7] border border-[#F2D399] text-xs text-[#14241C]">
                You are currently browsing in a Guest (Anonymous) session. Sign in with an Admin
                Email/Password account to access management tools.
              </div>
            )}

            <div className="flex gap-1.5 p-1 bg-[#FAF4F6] border border-[#E5D5DA] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  mode === 'login' ? 'bg-[#FFF6F9] text-[#164A31] shadow-xs border border-[#E5D5DA]/60' : 'text-[#4F6156]'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  mode === 'register' ? 'bg-[#FFF6F9] text-[#164A31] shadow-xs border border-[#E5D5DA]/60' : 'text-[#4F6156]'
                }`}
              >
                Create Admin Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="adm-name"
                    className="block text-xs font-semibold text-[#14241C] mb-1.5"
                  >
                    Admin Name
                  </label>
                  <input
                    id="adm-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Store Manager"
                    className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="adm-email"
                  className="block text-xs font-semibold text-[#14241C] mb-1.5"
                >
                  Admin Email
                </label>
                <input
                  id="adm-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nativora.com"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="adm-pass"
                  className="block text-xs font-semibold text-[#14241C] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="adm-pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#FFF2F5] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:bg-[#FFF6F9] focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-semibold rounded-xl cursor-pointer min-h-[44px] disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#FBBF24]" />
                    <span>{mode === 'login' ? 'Sign In to Admin' : 'Register Admin User'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
