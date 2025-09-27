"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ColorProvider } from "@/components/client/colorProvider/ColorProvider";
import "./verify-email.css";

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
          setStatus('error');
          setMessage('Invalid verification link. Please try again.');
          return;
        }

        // Call your verification endpoint
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You are now subscribed to our newsletter.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again later.');
      }
    };

    handleVerification();
  }, [searchParams]);

  return (
    <ColorProvider>
      <section className="section-regular verifyWrapper">
        <div className="verificationCard">
          {status === 'loading' && (
            <>
              <div className="loadingSpinner"></div>
              <h2>Verifying your email...</h2>
              <p>Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="successIcon">✅</div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <div className="successActions">
                <a href="/" className="homeButton">Go to Homepage</a>
                <a href="/newsletter" className="newsletterButton">View Newsletter</a>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="errorIcon">❌</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="errorActions">
                <a href="/newsletter" className="retryButton">Try Again</a>
                <a href="/" className="homeButton">Go to Homepage</a>
              </div>
            </>
          )}
        </div>
      </section>
    </ColorProvider>
  );
}
