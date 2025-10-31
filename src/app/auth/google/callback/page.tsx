'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleCallbackInner() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) return;

    const handleCallback = async () => {
      try {
        setHasProcessed(true);

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Missing authorization code');
        }

        // Exchange code for access token and user info
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Google authentication failed');
        }

        const data = await response.json();
        
        // Redirect based on user role
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // Only run in browser
    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [searchParams, router, hasProcessed]);

  if (isLoading) {
    return (
      <div className="underWrapper">
        <div className="formWrapper">
          <h2 className="newsletterTitle">Completing Google Sign-in...</h2>
          <p className="subscribeDescription">
            Please wait while we set up your account
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="underWrapper">
        <div className="formWrapper">
          <h2 className="newsletterTitle" style={{ color: '#ff6b6b' }}>Authentication Failed</h2>
          <p className="subscribeDescription">
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="formWrapper button"
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="underWrapper">
        <div className="formWrapper">
          <h2 className="newsletterTitle">Loading...</h2>
          <p className="subscribeDescription">
            Please wait...
          </p>
        </div>
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}