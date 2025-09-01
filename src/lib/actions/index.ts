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

const COOLDOWN_MS = 60 * 1000 // 1 minute

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

    // 3. Check last attempt from Firestore
    const attemptDoc = doc(db, "newsletter_attempts", ip)
    const attemptSnap = await getDocs(
      query(collection(db, "newsletter_attempts"), where("__name__", "==", ip))
    )

    if (!attemptSnap.empty) {
      const lastAttempt = attemptSnap.docs[0].data().lastAttempt?.toMillis?.()
      const now = Date.now()
      if (lastAttempt && now - lastAttempt < COOLDOWN_MS) {
        return { error: "Too many attempts. Please wait a minute." }
      }
    }

    // 4. Save/update attempt timestamp
    await setDoc(attemptDoc, { lastAttempt: new Date() })

    // 5. Prevent duplicates
    const q = query(collection(db, "subscribers"), where("email", "==", email))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { error: "This email is already subscribed." }
    }

    // 6. Save subscriber
    await addDoc(collection(db, "subscribers"), {
      email,
      createdAt: serverTimestamp(),
      ip,
    })

    return { success: true }
  } catch (err) {
    console.error("Newsletter error:", err)
    return { error: "Something went wrong." }
  }
}
