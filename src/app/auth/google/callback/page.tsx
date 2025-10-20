"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleGoogleCallback } from '@/lib/shopify/googleAuth';
import { useShopifyAuth } from '@/context/ShopifyAuthContext';

function GoogleCallbackInner() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useShopifyAuth();

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

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Handle the Google OAuth callback
        const accessToken = await handleGoogleCallback(code, state);

        // Login the user with the access token
        login(accessToken.accessToken);

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';

        // Handle special case for existing account
        if (errorMessage === 'EXISTING_ACCOUNT_NEEDS_LOGIN') {
          // Extract email from the Google user info (we need to get this from the OAuth flow)
          // For now, we'll show a generic message and redirect to login
          setShowLoginPopup(true);
          setUserEmail('your email');
        } else if (errorMessage.includes('Customer already exists')) {
          setError('An account with this email already exists. Please use regular login or try a different Google account.');
        } else if (errorMessage.includes('Unable to create customer')) {
          setError('Unable to create your account. Please try again or contact support.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only run in browser
    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [searchParams, login, router, hasProcessed]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Completing Google sign-in...</p>
        </div>
      </div>
    );
  }

  if (showLoginPopup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Account Already Exists
            </h2>
            <p className="text-gray-600 mb-6">
              You already have an account with this email. Would you like to login instead?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleLoginRedirect}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Yes, Login
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}
