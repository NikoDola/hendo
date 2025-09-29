import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ error: "Invalid verification link" }, { status: 400 });
    }

    // Get the email document
    const emailDoc = await getDoc(doc(collection(db, "newsletter"), email));
    if (!emailDoc.exists()) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const data = emailDoc.data();

    // Check if token matches and email is not already verified
    if (data.verificationToken !== token) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    if (data.verified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    // Mark email as verified - NOW the email is actually stored in Firestore
    await updateDoc(doc(collection(db, "newsletter"), email), {
      verified: true,
      verifiedAt: new Date(),
      verificationToken: null, // Clear the token
    });

    console.log(`✅ Email ${email} verified and stored in Firestore`);

    return NextResponse.json({ message: "Email verified successfully! You're now subscribed to HENDO Music updates." });
  } catch (err) {
    console.error("Email verification error:", err);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
