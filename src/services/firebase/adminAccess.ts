import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';

const BOOTSTRAPPED_ADMIN_EMAIL = 'nirjonmunna5@gmail.com';

function getConfiguredAdminUids(): string[] {
  const raw = import.meta.env.VITE_ADMIN_UIDS || '';
  return raw
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean);
}

export async function checkIsAdminUser(user: User | null): Promise<{
  isAdmin: boolean;
  reason: 'admins_doc' | 'verified_owner_email' | 'env_uid_list' | 'none';
}> {
  if (!user) {
    return { isAdmin: false, reason: 'none' };
  }

  // Primary Firestore UID registry check (/admins/{uid})
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) {
      return { isAdmin: true, reason: 'admins_doc' };
    }
  } catch {
    // Ignore read denial if not admin
  }

  // Verified owner bootstrap check (matches Firestore Security Rules)
  if (
    user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
    user.emailVerified === true
  ) {
    return { isAdmin: true, reason: 'verified_owner_email' };
  }

  // Optional static UID allowlist hint (Firestore Rules still enforce /admins/{uid})
  if (getConfiguredAdminUids().includes(user.uid)) {
    return { isAdmin: true, reason: 'env_uid_list' };
  }

  return { isAdmin: false, reason: 'none' };
}
