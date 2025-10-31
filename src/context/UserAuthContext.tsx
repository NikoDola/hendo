'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  console.log('Getting ID token...');
  const idToken = await firebaseUser.getIdToken();
  console.log('Setting server session...');
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  console.log('Session response:', response.status, response.ok);
  if (!response.ok) {
    const error = await response.text();
    console.error('Session error:', error);
  }
}

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result if present
    (async () => {
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Redirect result found, setting session...');
          await setServerSessionFromCurrentUser(result.user);
        } else {
          console.log('No redirect result');
        }
      } catch (e) {
        console.error('Redirect result error:', e);
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        console.log('Auth state changed:', fbUser ? 'User logged in' : 'User logged out');
        if (fbUser) {
          console.log('Setting server session...');
          await setServerSessionFromCurrentUser(fbUser);
          // Ask server for role and normalized user
          console.log('Fetching user role...');
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          console.log('Server response:', data);
          if (data?.authenticated) {
            console.log('User authenticated, setting user state');
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: data.user.role as Role,
            });
          } else {
            console.log('User not authenticated on server');
            setUser(null);
          }
        } else {
          console.log('No Firebase user, clearing state');
          setUser(null);
        }
      } catch (e) {
        console.error('Auth state change error:', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('Starting Google sign-in with popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Popup sign-in successful, setting session...');
      await setServerSessionFromCurrentUser(result.user);
    } catch (e) {
      console.log('Popup failed, trying redirect:', e);
      await signInWithRedirect(auth, provider);
    }
  };

  const signInEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user);
  };

  const signUpEmail = async (firstName: string, lastName: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setServerSessionFromCurrentUser(cred.user);
    // Upsert profile info on server (no password sent)
    await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email }),
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signInEmail, signUpEmail, signOut }),
    [user, loading]
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


