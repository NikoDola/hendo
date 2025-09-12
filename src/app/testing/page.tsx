"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export default function TestVerification() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleTest = async () => {
    setStatus("⏳ Creating user and sending verification...");
    try {
      const password = Math.random().toString(36).slice(-10);

      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await sendEmailVerification(userCred.user);
      setStatus("✅ Verification email sent! Check your inbox/spam.");
    } catch (err) {
      console.error("Test error:", err);
      setStatus(`❌ Error: ${err}`);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Verification Email</h1>
      <input
        type="email"
        placeholder="Enter test email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "0.5rem" }}
      />
      <button onClick={handleTest} style={{ padding: "0.5rem 1rem" }}>
        Send Verification
      </button>
      <p>{status}</p>
    </div>
  );
}
