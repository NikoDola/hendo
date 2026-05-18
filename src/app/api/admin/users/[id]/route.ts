import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('fb_session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await firebaseAdmin.auth().verifySessionCookie(session, true);
    const email = decoded.email?.toLowerCase() || '';
    if (!isAuthorizedAdmin(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = firebaseAdmin.firestore();
    const userRef = db.collection('users').doc(id);
    const snapshot = await userRef.get();

    if (snapshot.exists) {
      const data = snapshot.data() as { authUid?: string; email?: string } | undefined;
      try {
        let uidToDelete = data?.authUid;
        if (!uidToDelete && data?.email) {
          const userRecord = await firebaseAdmin.auth().getUserByEmail(String(data.email));
          uidToDelete = userRecord.uid;
        }
        if (uidToDelete) {
          await firebaseAdmin.auth().deleteUser(uidToDelete);
        }
      } catch (e) {
        console.warn('Auth user delete failed (continuing to delete Firestore doc):', e);
      }
      await userRef.delete();
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
