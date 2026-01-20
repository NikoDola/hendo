"use server"

import { headers } from "next/headers"
import { firebaseAdmin } from "@/lib/firebaseAdmin"

import { sendVerificationEmail } from "@/lib/email"

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_ATTEMPTS = 20 // Maximum attempts per IP per hour (temporary for testing)

export async function newsletter(email: string, token: string) {
  try {
    const emailNormalized = (email || "").toLowerCase().trim()

    if (!emailNormalized) {
      return { error: "Email is required." }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailNormalized)) {
      return { error: "Please enter a valid email address." }
    }

    // 1. Verify recaptcha
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })
    const data = await res.json()
    if (!data.success || data.score < 0.5) {
      return { error: "Recaptcha verification failed." }
    }

    // 2. Get client IP (await headers() in server actions)
    const headerStore = await headers()
    const forwardedFor = headerStore.get("x-forwarded-for")
    const realIp = headerStore.get("x-real-ip")
    const ip = (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "unknown"

    const firestore = firebaseAdmin.firestore()
    const now = Date.now()

    // 3. Rate limit per IP (3/hour)
    const attemptsRef = firestore.collection("newsletter_attempts").doc(ip)
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(attemptsRef)
      const attemptsRaw = (snap.exists ? (snap.data()?.attempts as number[] | undefined) : []) || []
      const recentAttempts = attemptsRaw.filter((ms) => now - ms < WINDOW_MS)
      if (recentAttempts.length >= MAX_ATTEMPTS) {
        throw new Error("RATE_LIMIT")
      }
      tx.set(
        attemptsRef,
        {
          attempts: [...recentAttempts, now],
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    })

    // 4. Prevent duplicate subscription by using email as doc id
    const subscriberRef = firestore.collection("subscribers").doc(emailNormalized)
    const existing = await subscriberRef.get()
    if (existing.exists) {
      return { error: "This email is already subscribed." }
    }

    // 5. Generate verification token
    const verificationToken = Math.random().toString(36).slice(-12) + Date.now().toString(36)

    // 6. Save subscriber to Firestore for tracking
    await subscriberRef.set({
      email: emailNormalized,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      ip,
      source: "newsletter",
      verified: false,
      verificationToken,
    })

    // 8. Try to send verification email using custom service
    try {
      await sendVerificationEmail(emailNormalized, verificationToken)
      return { success: true }
    } catch (emailError) {
      console.error('Custom email service failed:', emailError)
      // Even if email service fails, we still saved the subscriber
      return { success: true, warning: "Subscription saved, but verification email may not have been sent. Please check your spam folder." }
    }

  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMIT") {
      return { error: `Too many signups. Limit is ${MAX_ATTEMPTS} per hour. Please wait and try again.` }
    }
    console.error("Newsletter error:", err)
    return { error: "Something went wrong." }
  }
}
