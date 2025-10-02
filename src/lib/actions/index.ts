"use server"

import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { headers } from "next/headers"
import { registerCustomer } from "@/lib/shopify/storefront"
import { createCustomer } from "@/lib/shopify/admin"
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email"
import { syncNewsletterSubscriberToShopify } from "@/lib/firebase-shopify-sync"

const COOLDOWN_MS = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 3 // Maximum attempts per IP

export async function newsletter(email: string, token: string) {
  try {
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
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown"

    // 3. Check attempts from Firestore
    const attemptDoc = doc(db, "newsletter_attempts", ip)
    const attemptSnap = await getDocs(
      query(collection(db, "newsletter_attempts"), where("__name__", "==", ip))
    )

    const now = Date.now()
    let attemptData: { attempts: any[], lastAttempt: any } = { attempts: [], lastAttempt: null }

    if (!attemptSnap.empty) {
      const docData = attemptSnap.docs[0].data()
      attemptData = {
        attempts: docData.attempts || [],
        lastAttempt: docData.lastAttempt || null
      }
    }

    // Filter out attempts older than 1 minute
    const recentAttempts = attemptData.attempts?.filter((timestamp: any) => {
      const attemptTime = timestamp?.toMillis?.() || timestamp
      return now - attemptTime < COOLDOWN_MS
    }) || []

    // Check if user has exceeded max attempts
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      return { error: `Too many attempts. You can try ${MAX_ATTEMPTS} times per minute. Please wait.` }
    }

    // 4. Save/update attempt data
    const newAttempts = [...recentAttempts, new Date()]
    await setDoc(attemptDoc, {
      attempts: newAttempts,
      lastAttempt: new Date()
    })

    // 5. Check if email already exists in Firestore
    const q = query(collection(db, "subscribers"), where("email", "==", email))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { error: "This email is already subscribed." }
    }

    // 6. Generate verification token
    const verificationToken = Math.random().toString(36).slice(-12) + Date.now().toString(36)

    // 7. Save subscriber to Firestore for tracking
    const subscriberRef = await addDoc(collection(db, "subscribers"), {
      email,
      createdAt: serverTimestamp(),
      ip,
      source: "newsletter",
      verified: false,
      verificationToken: verificationToken
    })

    // 8. Sync to Shopify (create customer account)
    try {
      await syncNewsletterSubscriberToShopify(email, "Newsletter", "Subscriber")
      console.log('Successfully synced newsletter subscriber to Shopify')
    } catch (syncError) {
      console.error('Failed to sync to Shopify, but continuing with newsletter signup:', syncError)
      // Don't fail the newsletter signup if Shopify sync fails
    }

    // 9. Try to send verification email using custom service
    try {
      await sendVerificationEmail(email, verificationToken)
      return { success: true }
    } catch (emailError) {
      console.error('Custom email service failed:', emailError)
      // Even if email service fails, we still saved the subscriber and synced to Shopify
      return { success: true, warning: "Subscription saved, but verification email may not have been sent. Please check your spam folder." }
    }

  } catch (err) {
    console.error("Newsletter error:", err)
    return { error: "Something went wrong." }
  }
}
