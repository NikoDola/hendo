"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

    // Verify the email
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
    <div style={{
      textAlign: "center",
      marginTop: "5rem",
      fontFamily: "var(--font-lemonmilk), system-ui, sans-serif",
      background: "linear-gradient(135deg, #5227FF, #FF9FFC, #B19EEF)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      padding: "2rem"
    }}>
      <div style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: "3rem",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
        maxWidth: "600px",
        width: "100%"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          letterSpacing: "2px"
        }}>
          {loading ? "⏳" : status.includes("✅") ? "🎉" : "❌"}
        </h1>

        <p style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          lineHeight: "1.6"
        }}>
          {status}
        </p>

        {status.includes("✅") && (
          <div style={{ marginTop: "2rem" }}>
            <p style={{ marginBottom: "1rem", fontSize: "1rem", opacity: 0.9 }}>
              You&apos;ll now receive updates about:
            </p>
            <ul style={{
              textAlign: "left",
              display: "inline-block",
              fontSize: "0.9rem",
              opacity: 0.8
            }}>
              <li>🎵 New music releases</li>
              <li>👕 Exclusive clothing drops</li>
              <li>🎬 Behind-the-scenes content</li>
              <li>🚀 Site launch notifications</li>
            </ul>
          </div>
        )}

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "1rem 2rem",
            borderRadius: "50px",
            textDecoration: "none",
            border: "2px solid rgba(255,255,255,0.3)",
            transition: "all 0.3s ease",
            fontSize: "1.1rem",
            fontWeight: "bold"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
