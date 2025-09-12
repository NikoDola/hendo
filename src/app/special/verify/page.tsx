"use client";

import { useEffect, useState, Suspense } from "react";
import { auth } from "@/lib/firebase";
import { applyActionCode } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const [status, setStatus] = useState("Verifying your email...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setStatus("❌ Invalid verification link.");
      return;
    }

    // Apply the email verification action
    applyActionCode(auth, oobCode)
      .then(() => setStatus("✅ Email verified! Welcome aboard 🎉"))
      .catch((err) => {
        console.error("Verification error:", err);
        setStatus("❌ Verification failed. This link may have expired.");
      });
  }, [searchParams]);

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>{status}</h1>

      {status.startsWith("✅") && (
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            backgroundColor: "#000",
            color: "#fff",
            padding: "0.8rem 1.5rem",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Go back to Home
        </Link>
      )}
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
