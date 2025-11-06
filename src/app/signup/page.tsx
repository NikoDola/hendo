'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectResult, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUserAuth } from '@/context/UserAuthContext';
import '@/components/pages/Signup.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, loading } = useUserAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Complete redirect-based sign-in if redirected back
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result) return;
        const idToken = await result.user.getIdToken();
        await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
        const me = await fetch('/api/auth/me');
        const data = await me.json();
        if (data?.user?.role === 'admin') router.push('/admin/dashboard');
        else router.push('/dashboard');
      } catch {}
    })();
  }, [router]);

  const { signInWithGoogle } = useUserAuth();
  const handleGoogleSignup = async () => {
    console.log('Signup page: initiating Google sign-in');
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Google sign-up failed', e);
      setError('Google sign-up failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Create Firebase account
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await cred.user.getIdToken();
      await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      // Upsert name details in backend separately
      await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email }) });
      setSuccess(true);
      setTimeout(async () => {
        const me = await fetch('/api/auth/me');
        const data = await me.json();
        if (data?.user?.role === 'admin') router.push('/admin/dashboard');
        else router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Signup error:', error);
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="underWrapper">
        <div className="formWrapper">
          <h2 className="newsletterTitle">Account Created!</h2>
          <p className="subscribeDescription">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="underWrapper">
      <div className="formWrapper">
        <h2 className="newsletterTitle">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="signupForm">
          <div className="inputWrapper signupInputWrapper">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter your first name"
            />
          </div>

          <div className="inputWrapper signupInputWrapper">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter your last name"
            />
          </div>

          <div className="inputWrapper signupInputWrapper">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter your email"
            />
          </div>

          <div className="inputWrapper signupInputWrapper">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="input"
              placeholder="Create a password"
            />
          </div>

          <div className="inputWrapper signupInputWrapper">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="input"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <div className="inputWrapper signupInputWrapper">
              <p className="signupErrorText">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="signupSubmitButton"
          >
            {isLoading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>

          <p className="subscribeDescription signupDescription">
            Join our community and get started
          </p>
        </form>

        <div className="orWrapper signupOrSection">
          <div className="signupOrDivider">
            <div className="signupOrLine"></div>
            <span className="signupOrText">OR</span>
            <div className="signupOrLine"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="signupGoogleButton"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="orWrapper">
          <p className="signupFooterText">
            Already have an account?{' '}
            <a href="/login" className="signupLoginLink">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
