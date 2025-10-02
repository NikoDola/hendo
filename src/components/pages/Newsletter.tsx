"use client";
import "./Newsletter.css";
import { ColorProvider } from "../client/colorProvider/ColorProvider";

import { newsletter } from "@/lib/actions";
import { useState, useEffect } from "react";

declare global {
  interface Window {
    grecaptcha: {
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

export default function Newsletter() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load reCAPTCHA script on mount
  useEffect(() => {
    if (!document.querySelector("#recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // 🔑 Get reCAPTCHA token (strongly typed)
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string,
        { action: "newsletter" }
      );

      // Pass email + token to server action
      const result = await newsletter(email, token);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Check your email for verification! 🎉");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorProvider>
      <section className="section-regular underWrapper">
        <span className="newsletterTitle">NEWSLETTER</span>
        <p className="subscribeDescription">
          Subscribe to our newsletter and be the first to hear about new music,
          exclusive drops from our clothing brand, and behind-the-scenes content.
          We&apos;ll also send you updates when new features go live.
        </p>
        <div className="newsletterWrapper">
          <input
            onInput={handleEmail}
            value={email}
            className="inputNewsletter"
            placeholder="Your Email"
            type="email"
          />
          <button
            onClick={handleSubmit}
            className="subscribe"
            disabled={loading}
          >
            {loading ? "Loading..." : "SUBSCRIBE"}
          </button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && (
          <div style={{
            color: 'green',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0ea5e9' }}>Verification Email Sent! 📧</h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              We&apos;ve sent a verification email to <strong>{email}</strong>
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#64748b' }}>
              Please check your email and click the verification link to complete your subscription.
            </p>
          </div>
        )}
        <p  className="my-recaptcha-disclaimer ">
          This site is protected by reCAPTCHA and the Google
          <br></br>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            Privacy Policy
          </a>
          and
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </section>
    </ColorProvider>
  );
}
