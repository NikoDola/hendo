"use client";

import Logo from "../client/Logo";
import "./UnderConstruction.css";
import { ColorProvider } from "../client/colorProvider/ColorProvider";

import { useState, useEffect } from "react";
import { createShopifyCustomer } from "@/lib/shopify";

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

    if (attempts >= 10) {
      setError("You have reached the maximum number of attempts. Please try again later.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ reCAPTCHA validation
      await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string,
        { action: "newsletter" }
      );

      // 2️⃣ Create customer in Shopify
      const shopifyCustomer = await createShopifyCustomer({
        email: email,
        acceptsMarketing: true,
        tags: ["newsletter-subscriber", "hendo-music"]
      });

      if (shopifyCustomer.userErrors.length > 0) {
        // Check if it's a duplicate email error
        if (shopifyCustomer.userErrors[0].message.includes("Email has already been taken")) {
          setError("This email is already subscribed to our newsletter!");
          return;
        }
        throw new Error(`Shopify error: ${shopifyCustomer.userErrors[0].message}`);
      }

      console.log("✅ Customer created in Shopify:", shopifyCustomer.customer.id);
      setSuccess("Successfully subscribed to our newsletter! 🎉");
      setEmail("");

      // Update attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem("newsletter_attempts", String(newAttempts));
    } catch (err: unknown) {
      console.error("Newsletter signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Could not subscribe: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorProvider>
      <section className="underWrapper">
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