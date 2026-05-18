'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import styles from './page.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOut } = useUserAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (user) {
      setError(`${user.email} is not an authorized admin account.`);
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Google sign-in failed', e);
      setError('Google sign-in failed. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out failed', e);
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
      </div>
    </div>
  );
}
