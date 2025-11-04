import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify admin via Firebase session cookie
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = decoded.email?.toLowerCase() || '';
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Firestore doc to get authUid
    const userRef = doc(db, 'users', id);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as { authUid?: string; email?: string };
      // Try delete in Firebase Auth first
      try {
        let uidToDelete = data.authUid as string | undefined;
        if (!uidToDelete && data.email) {
          // Fallback: resolve UID by email if we never stored authUid
          const userRecord = await firebaseAdmin.auth().getUserByEmail(String(data.email));
          uidToDelete = userRecord.uid;
        }
        if (uidToDelete) {
          await firebaseAdmin.auth().deleteUser(uidToDelete);
        }
      } catch (e) {
        console.warn('Auth user delete failed (continuing to delete Firestore doc):', e);
      }
      // Remove Firestore document
      await deleteDoc(userRef);
    }
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
