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

async function setServerSessionFromCurrentUser(firebaseUser: FirebaseUser | null): Promise<void> {
  if (!firebaseUser) return;
  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
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

    // iOS Safari frequently blocks/halts popups; redirect is the most reliable.
    const isIOSSafari =
      typeof window !== 'undefined' &&
      /iP(hone|od|ad)/.test(navigator.userAgent) &&
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

    provider.setCustomParameters({ prompt: 'select_account' });

    if (isIOSSafari) {
      await signInWithRedirect(auth, provider);
      return;
    }

    // Try popup, but if it errors OR hangs (Safari/pop-up blockers), fall back to redirect.
    try {
      const popupPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('popup-timeout')), 800);
      });

      const result = await Promise.race([popupPromise, timeoutPromise]);
      // If we got here, popup succeeded
      await setServerSessionFromCurrentUser((result as { user: FirebaseUser }).user);
    } catch {
      await signInWithRedirect(auth, provider);
    }
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user);
  }, []);

  const signUpEmail = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user);
    // Upsert profile info on server (no password sent)
    await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email }),
    });
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


