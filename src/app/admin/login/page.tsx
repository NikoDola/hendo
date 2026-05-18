'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import styles from './page.module.css';

type DebugInfo = {
  step: string;
  contextLoading: boolean;
  contextUserEmail: string | null;
  contextUserRole: string | null;
  meStatus: number | null;
  meBody: string | null;
  cookieEnabled: boolean;
  protocol: string;
  host: string;
  lastError: string | null;
};

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOut } = useUserAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const redirectedRef = useRef(false);

  const [debug, setDebug] = useState<DebugInfo>({
    step: 'mount',
    contextLoading: true,
    contextUserEmail: null,
    contextUserRole: null,
    meStatus: null,
    meBody: null,
    cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : true,
    protocol: typeof window !== 'undefined' ? window.location.protocol : '',
    host: typeof window !== 'undefined' ? window.location.host : '',
    lastError: null,
  });

  // Mirror context state into the debug panel so the client can see it on-screen.
  useEffect(() => {
    setDebug((d) => ({
      ...d,
      contextLoading: loading,
      contextUserEmail: user?.email ?? null,
      contextUserRole: user?.role ?? null,
    }));
  }, [user, loading]);

  // On mount, hit /api/auth/me directly and surface the result.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const text = await res.text();
        if (cancelled) return;
        setDebug((d) => ({
          ...d,
          step: 'fetched /api/auth/me on mount',
          meStatus: res.status,
          meBody: text.slice(0, 500),
        }));
      } catch (e) {
        if (cancelled) return;
        setDebug((d) => ({
          ...d,
          step: 'fetch /api/auth/me failed on mount',
          lastError: (e as Error)?.message ?? String(e),
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'admin') {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        setDebug((d) => ({ ...d, step: 'redirecting to /admin/dashboard' }));
      }
      router.push('/admin/dashboard');
    } else if (user) {
      setError(
        `Signed in as ${user.email ?? '(no email returned)'} with role "${user.role}". ` +
        `This account is not on the admin allowlist, or the server session cookie did not stick. ` +
        `If this is the wrong Google account, click "Sign out and try another account" below and pick the correct one. ` +
        `If the email shown above IS your admin email, take a screenshot of this entire page (including the debug box at the bottom) and send it to the site owner.`
      );
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsSigningIn(true);
    setDebug((d) => ({ ...d, step: 'signInWithGoogle: starting' }));
    try {
      await signInWithGoogle();
      setDebug((d) => ({ ...d, step: 'signInWithGoogle: returned' }));

      // After sign-in, re-fetch /api/auth/me so the debug panel shows the new state.
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const text = await res.text();
        setDebug((d) => ({
          ...d,
          step: 'fetched /api/auth/me after sign-in',
          meStatus: res.status,
          meBody: text.slice(0, 500),
        }));
      } catch (e) {
        setDebug((d) => ({
          ...d,
          step: 'fetch /api/auth/me failed after sign-in',
          lastError: (e as Error)?.message ?? String(e),
        }));
      }
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      const message = (e as { message?: string })?.message ?? String(e);
      console.error('Google sign-in failed', e);
      setError(
        `Google sign-in failed. ` +
        (code ? `Code: ${code}. ` : '') +
        `Details: ${message}`
      );
      setDebug((d) => ({
        ...d,
        step: 'signInWithGoogle: threw',
        lastError: (code ? `${code}: ` : '') + message,
      }));
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    setDebug((d) => ({ ...d, step: 'signOut: starting' }));
    try {
      await signOut();
      setDebug((d) => ({ ...d, step: 'signOut: done' }));
    } catch (e) {
      console.error('Sign out failed', e);
      setDebug((d) => ({
        ...d,
        step: 'signOut: threw',
        lastError: (e as Error)?.message ?? String(e),
      }));
    }
  };

  const showSignedInButNotAdmin = !!user && user.role !== 'admin';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Music size={48} />
        </div>
        <h2 className={styles.title}>Admin Login</h2>
        <p className={styles.subtitle}>Access the music management panel</p>
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.card}>
          {error && <div className={styles.error}>{error}</div>}

          {showSignedInButNotAdmin ? (
            <button
              type="button"
              onClick={handleSignOut}
              className={styles.button}
            >
              Sign out and try another account
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSigningIn || loading}
              className={styles.googleButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSigningIn ? 'Signing in...' : 'Continue with Google'}
            </button>
          )}

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <span />
            </div>
            <div className={styles.dividerLabel}>
              <span>Security Notice</span>
            </div>
          </div>
          <div className={styles.notice}>
            <p>This admin panel is restricted to authorized personnel only.</p>
            <p>All access attempts are logged and monitored.</p>
          </div>
        </div>

        {/* On-screen diagnostic panel — visible to the client so they can screenshot it. */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: '2px dashed #f59e0b',
            borderRadius: '0.5rem',
            background: '#fffbeb',
            color: '#92400e',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            DEBUG INFO (please screenshot if login does not work)
          </div>
          <div>step: {debug.step}</div>
          <div>contextLoading: {String(debug.contextLoading)}</div>
          <div>contextUserEmail: {debug.contextUserEmail ?? '(null)'}</div>
          <div>contextUserRole: {debug.contextUserRole ?? '(null)'}</div>
          <div>meStatus: {debug.meStatus ?? '(not called yet)'}</div>
          <div>meBody: {debug.meBody ?? '(empty)'}</div>
          <div>cookieEnabled: {String(debug.cookieEnabled)}</div>
          <div>protocol: {debug.protocol}</div>
          <div>host: {debug.host}</div>
          <div>userAgent: {typeof navigator !== 'undefined' ? navigator.userAgent : ''}</div>
          <div>lastError: {debug.lastError ?? '(none)'}</div>
        </div>
      </div>
    </div>
  );
}
