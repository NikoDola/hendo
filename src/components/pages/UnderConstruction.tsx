"use client";

import Logo from "../client/Logo";
import "./UnderConstruction.css";
import { ColorProvider } from "../client/colorProvider/ColorProvider";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

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

export default function UnderConstruction() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Load reCAPTCHA script once
  useEffect(() => {
    if (!document.querySelector("#recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.body.appendChild(script);
    }

    // Load attempts from localStorage
    const saved = localStorage.getItem("newsletter_attempts");
    if (saved) setAttempts(Number(saved));
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    if (attempts >= 5) {
      setError("You have reached the maximum number of attempts. Try again later.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ reCAPTCHA validation
      await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string,
        { action: "newsletter" }
      );

      // 2️⃣ Create user + send verification email
      const password = Math.random().toString(36).slice(-10);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        await sendEmailVerification(userCred.user, {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/special/verify`,
          handleCodeInApp: true,
        });
        console.log("✅ Verification email sent to:", email);
        setSuccess("Check your email inbox/spam to verify your subscription 🎉");
      } catch (err: unknown) {
        console.error("❌ Verification email failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const errorCode = (err as { code?: string }).code || "unknown";
        setError(`Firebase error: ${errorCode} - ${errorMessage}`);
      }

      setEmail("");

      // Update attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem("newsletter_attempts", String(newAttempts));
    } catch (err: unknown) {
      console.error("Newsletter signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Could not send verification email: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorProvider>
      <section className="section-regular underWrapper">
        <Logo />
        <span className="underConstructionText">UNDER CONSTRUCTION</span>
        <p className="subscribeDescription">
          Subscribe so you&apos;ll be the first to hear my new music, see what
          I&apos;m creating behind the scenes, and catch exclusive drops from my
          clothing brand. I&apos;ll also send you a heads-up the moment this
          site goes live.
        </p>
        <div className="newsletterWrapper">
          <input
            onInput={handleEmail}
            value={email}
            className="inputNewsletter"
            placeholder="Your Email"
            type="email"
          />
          <button onClick={handleSubmit} className="subscribe" disabled={loading}>
            {loading ? "Loading..." : "SUBSCRIBE"}
          </button>
        </div>
        {error && <p className="errorMessage">{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <p style={{ fontSize: "0.9rem", color: "#888" }}>
          Attempts: {attempts}/3
        </p>
        <p className="my-recaptcha-disclaimer">
          This site is protected by reCAPTCHA and the Google
          <br />
          <a
            className="linkRecaptcha"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          and
          <a
            className="linkRecaptcha"
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </section>
    </ColorProvider>
  );
}
