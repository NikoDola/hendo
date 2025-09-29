// Customer account redirect page
"use client";

import { useEffect, useState } from 'react';
import Logo from '@/components/client/Logo';

export default function AccountRedirect() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown before redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = 'https://shopify.com/71655293065/account';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'var(--font-lemonmilk), system-ui, sans-serif',
      background: 'linear-gradient(135deg, #5227FF, #FF9FFC, #B19EEF)',
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <Logo />

      <h1 style={{
        marginTop: '2rem',
        marginBottom: '1rem',
        fontSize: '2rem',
        fontWeight: 'bold',
        letterSpacing: '2px'
      }}>
        CUSTOMER ACCOUNT
      </h1>

      <p style={{
        fontSize: '1.2rem',
        marginBottom: '2rem',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        Redirecting to your account in {countdown} seconds...
      </p>

      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '2rem'
      }}></div>

      <p style={{
        fontSize: '0.9rem',
        opacity: 0.8,
        maxWidth: '400px'
      }}>
        If you&apos;re not redirected automatically,
        <a
          href="https://shopify.com/71655293065/account"
          style={{
            color: 'white',
            textDecoration: 'underline',
            marginLeft: '0.5rem'
          }}
        >
          click here
        </a>
      </p>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
