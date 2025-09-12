import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await setDoc(doc(collection(db, "newsletter"), email), {
      email,
      verified: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Email saved" });
  } catch (err) {
    console.error("Newsletter save error:", err);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
