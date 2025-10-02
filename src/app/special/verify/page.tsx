"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "@/components/pages/verify.css";
import "@/components/pages/stars.css";
import "@/components/pages/blinking-stars.css";

function VerifyContent() {
  const [status, setStatus] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("❌ Invalid verification link.");
      setLoading(false);
      return;
    }

    // First verify the email
    fetch(`/api/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          // Email verified successfully, now create Shopify customer
          console.log("✅ Email verified, creating Shopify customer...");

          try {
            const shopifyResponse = await fetch(`/api/create-customer?email=${encodeURIComponent(email)}`);
            const shopifyData = await shopifyResponse.json();

            if (shopifyResponse.ok) {
              console.log("✅ Shopify customer created:", shopifyData);
              setStatus("✅ Email verified! Welcome to HENDO DREAMSTATION! ⭐");
            } else {
              console.log("⚠️ Shopify customer creation failed:", shopifyData);
              setStatus("✅ Email verified! Welcome to HENDO DREAMSTATION! ⭐");
            }
          } catch (shopifyError) {
            console.error("❌ Shopify customer creation error:", shopifyError);
            setStatus("✅ Email verified! Welcome to HENDO DREAMSTATION! ⭐");
          }
        } else {
          setStatus(`❌ ${data.error || "Verification failed"}`);
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        setStatus("❌ Verification failed. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  return (
    <>
      {/* Blinking Stars Background */}
      <div className="blinking-stars-container">
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
        <span className="blinking-star"></span>
      </div>

      {/* Shooting Stars Background */}
      <div className="stars-container">
        <div className="stars-section">
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
          <span className="star"></span>
        </div>
      </div>

      <div className="verify-container">
        <div className="verify-box">
          <h1 className="verify-icon">
            {loading ? "⏳" : status.includes("✅") ? "⭐" : "❌"}
          </h1>

          <div className="verify-status">
            {status.includes("✅") ? (
              <>
                <h3>✅ Email verified!</h3>
                <p>Welcome to T.HENDO DREAMSTATION! ⭐</p>
              </>
            ) : (
              <p>{status}</p>
            )}
          </div>

          {status.includes("✅") && (
            <div className="verify-updates">
              <p>You&apos;ll now receive updates about:</p>
              <ul>
                <li>🎵 New music releases</li>
                <li>👕 Exclusive clothing drops</li>
                <li>🎬 Behind-the-scenes content</li>
                <li>🚀 Site launch notifications</li>
              </ul>
            </div>
          )}

          <Link
            href="/"
            className="verify-link"
          >
            {status.includes("✅") ? "Back to T.HENDO" : "Try Again"}
          </Link>
        </div>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "5rem" }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
