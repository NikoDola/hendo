'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

type Role = 'admin' | 'user';

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
}

interface UserAuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

async function setServerSessionFromCurrentUser(
  firebaseUser: FirebaseUser | null,
  profile?: { firstName?: string; lastName?: string }
): Promise<void> {
  if (!firebaseUser) return;
  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, ...(profile ?? {}) }),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error('Session error:', error);
  }
}

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  // Always start with null on both server and client to avoid hydration mismatch
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastKnownUserRef = useRef<SessionUser | null>(null);

  useEffect(() => {
    lastKnownUserRef.current = user;
  }, [user]);

  // Hydrate from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('hendo_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          setLoading(false); // If we have cached data, we're not loading
        }
      } catch {
        // Ignore errors
      }
    }
  }, []);

  useEffect(() => {
    // Handle redirect result if present
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await setServerSessionFromCurrentUser(result.user);
        } else {
        }
      } catch (e) {
        console.error('Redirect result error:', e);
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Block protected pages from bouncing while we resolve the server session + role.
      // Without this, there is a window where loading=false and user=null right after sign-in,
      // which causes /admin/dashboard and /dashboard to redirect back to /login.
      if (fbUser) {
        setLoading(true);
      }
      try {
        if (fbUser) {
          await setServerSessionFromCurrentUser(fbUser);

          // Ask server for role + normalized user (cookie creation can be briefly behind)
          const fetchMe = async () => fetch('/api/auth/me');
          let res = await fetchMe();
          if (res.status === 401) {
            await new Promise((r) => setTimeout(r, 600));
            res = await fetchMe();
          }

          let data: unknown = null;
          try {
            data = await res.json();
          } catch {
            data = null;
          }

          if (res.ok && (data as { authenticated?: boolean })?.authenticated) {
            const typed = data as { user?: { role?: Role } };
            const userData: SessionUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: (typed.user?.role || 'user') as Role,
            };
            setUser(userData);
            localStorage.setItem('hendo_user', JSON.stringify(userData));
          } else {
            // Don't aggressively log the user out just because /api/auth/me is temporarily unavailable.
            // Keep last known role if available; otherwise fall back to 'user' while session settles.
            const fallbackRole: Role =
              (lastKnownUserRef.current?.uid === fbUser.uid && lastKnownUserRef.current?.role) || 'user';
            const fallbackUser: SessionUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: fallbackRole,
            };
            setUser(fallbackUser);
            localStorage.setItem('hendo_user', JSON.stringify(fallbackUser));
          }
        } else {
          setUser(null);
          localStorage.removeItem('hendo_user');
        }
      } catch (e) {
        console.error('Auth state change error:', e);
        // Avoid booting the user to logged-out state due to transient network errors.
        // Preserve last known user if present.
        if (lastKnownUserRef.current) {
          setUser(lastKnownUserRef.current);
        } else {
          setUser(null);
          localStorage.removeItem('hendo_user');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Use a popup for ALL browsers, including iOS Safari. Our Firebase
    // authDomain (t-hendo.firebaseapp.com) is a different site from the app
    // (thelegendofhendo.com), so signInWithRedirect breaks under Safari's ITP /
    // third-party storage partitioning: the redirect returns but
    // getRedirectResult() is empty, so the user silently lands back on /login.
    // A popup completes auth in its own top-level (first-party) window and posts
    // the result back via postMessage, which ITP does NOT block — so it works on
    // Safari where redirect does not. signInWithPopup calls window.open
    // synchronously, so this must stay reachable without an await in front of it
    // from the click handler, or iOS Safari's popup blocker will stop it.
    try {
      const result = await signInWithPopup(auth, provider);
      await setServerSessionFromCurrentUser(result.user);
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      // Only fall back to redirect if the popup genuinely couldn't open. On
      // Safari this fallback is itself unreliable (same ITP reason as above),
      // but it covers the rare non-Safari popup-blocked case.
      const popupUnavailable =
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment';
      if (popupUnavailable) {
        await signInWithRedirect(auth, provider);
        return;
      }
      // Closed by user, network error, etc. — surface to caller; don't kick off a second flow.
      throw e;
    }
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user);
  }, []);

  const signUpEmail = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user, { firstName, lastName });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      // Clear cached user data
      localStorage.removeItem('hendo_user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signInEmail, signUpEmail, signOut }),
    [user, loading, signInWithGoogle, signInEmail, signUpEmail, signOut]
  );

  return (
    <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
  );
}

export function useUserAuth(): UserAuthContextValue {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
}


