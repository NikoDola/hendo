'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
          // Ask server for role and normalized user
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (data?.authenticated) {
            const userData = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: data.user.role as Role,
            };
            setUser(userData);
            // Cache user data in localStorage
            localStorage.setItem('hendo_user', JSON.stringify(userData));
          } else {
            setUser(null);
            localStorage.removeItem('hendo_user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('hendo_user');
        }
      } catch (e) {
        console.error('Auth state change error:', e);
        setUser(null);
        localStorage.removeItem('hendo_user');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await setServerSessionFromCurrentUser(result.user);
    } catch (e) {
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


