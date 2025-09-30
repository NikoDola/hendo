"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "@/components/pages/verify.css";

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

    fetch(`/api/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          setStatus("✅ Email verified! Welcome to HENDO Music! 🎵");
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
    <div className="verify-container">
      <div className="verify-box">
        <h1 className="verify-icon">
          {loading ? "⏳" : status.includes("✅") ? "🎉" : "❌"}
        </h1>

        <p className="verify-status">{status}</p>

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
          {status.includes("✅") ? "Back to HENDO" : "Try Again"}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "5rem" }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
