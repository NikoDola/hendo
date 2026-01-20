"use client";
import "./Newsletter.css";

import { newsletter } from "@/lib/actions";
import { useState, useEffect } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Load reCAPTCHA script on mount
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    const existing = document.querySelector<HTMLScriptElement>("#recaptcha-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Onload doesn't always mean grecaptcha.execute is ready yet; keep checking below.
      };
      document.body.appendChild(script);
    }

    // Mark ready when grecaptcha is actually usable
    let tries = 0;
    const MAX_TRIES = 100; // ~10s
    const interval = window.setInterval(() => {
      tries += 1;
      if (window.grecaptcha?.execute) {
        setRecaptchaReady(true);
        window.clearInterval(interval);
        return;
      }
      // If grecaptcha.ready exists, it can signal readiness too
      if (window.grecaptcha?.ready) {
        try {
          window.grecaptcha.ready(() => setRecaptchaReady(true));
        } catch {
          // ignore
        }
      }
      if (tries >= MAX_TRIES) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow email-safe characters; strip spaces and invalid chars while typing
    const cleaned = e.target.value
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9@._+\-]/g, "");
    setEmail(cleaned);
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
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        setError("reCAPTCHA is not configured. Missing site key.");
        return;
      }
      if (!window.grecaptcha?.execute) {
        setError("reCAPTCHA is still loading. Please try again in a moment.");
        return;
      }

      // 🔑 Get reCAPTCHA token (strongly typed)
      const token = await window.grecaptcha.execute(
        siteKey as string,
        { action: "newsletter" }
      );

      // Pass email + token to server action
      const result = await newsletter(email, token);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Check your email for verification!");
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

    <section className="section-regular underWrapper">
      <h2 className="newsletterTitle" data-text="NEWSLETTER">NEWSLETTER</h2>
      <p className="subscribeDescription">
        Subscribe to my newsletter and be the first to hear about new music,
        exclusive drops from our clothing brand, and behind-the-scenes content.
        We&apos;ll also send you updates when new features go live.
      </p>
      <div className="newsletterWrapper">
        <input
          onChange={handleEmail}
          value={email}
          className="inputNewsletter input"
          placeholder="Your Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={254}
        />
        <button
          onClick={handleSubmit}
          className="subscribe"
          disabled={loading}
        >
          {loading ? "Loading..." : "SUBSCRIBE"}
        </button>
      </div>
      {error && <p className="newsletterErrorMessage">{error}</p>}
      {success && (
        <div className="newsletterSuccessBox glass-effect">
          <h3 className="newsletterSuccessTitle">Verification Email Sent! 📧</h3>
          <p className="newsletterSuccessText">
            We&apos;ve sent a verification email to <strong>{email}</strong>
          </p>
          <p className="newsletterSuccessNote">
            Please check your email and click the verification link to complete your subscription.
          </p>
        </div>
      )}
      <p className="my-recaptcha-disclaimer ">
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

  );
}
