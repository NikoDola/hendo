"use client";


import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginCustomer } from "@/lib/shopify/storefront";
import { useShopifyAuth } from "@/context/ShopifyAuthContext";
import { initiateGoogleAuth } from "@/lib/shopify/googleAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, logout, customer, isLoading: authLoading } = useShopifyAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const accessToken = await loginCustomer(email, password);
      login(accessToken.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      initiateGoogleAuth(true); // true for login
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // If user is already logged in, show logout interface
  if (customer && !authLoading) {
    return (
      <section className="section-regular">
        <div className="formWrapper">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--foreground)' }}>
              Welcome back, {customer.firstName || customer.email}!
            </h2>
            <p style={{ marginBottom: '2rem', color: 'var(--foreground)' }}>
              You are already logged in.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--theme-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Go to Dashboard
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  border: '1px solid var(--foreground)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <section className="section-regular">
        <div className="formWrapper">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid var(--theme-color)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-regular">
      <form className="formWrapper" onSubmit={handleSubmit}>
        <div className="inputWrapper">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>

        <button type="button" className="googleButton" onClick={handleGoogleLogin}>
          <div className="googleIcon"></div>
          Login with Google
        </button>

        <div className="orWrapper">
          <p className="italic"> Don&apos;t have an account? <Link className="underline" href={"/signup"}>signup</Link></p>
        </div>
      </form>
    </section>
  );
}
