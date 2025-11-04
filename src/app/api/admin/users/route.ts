import { NextResponse } from 'next/server';
import { getAllUsers, isAdminEmail, createOrUpdateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
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

    // Fetch users from Firestore
    const firestoreUsers = await getAllUsers();
    const emailToUser = new Map<string, { email: string; name?: string; role?: string; createdAt?: Date; lastLoginAt?: Date; purchases?: number }>();
    firestoreUsers.forEach(u => emailToUser.set(u.email.toLowerCase(), u));

    // Also fetch users from Firebase Auth and include any missing
    const authUsersAccumulator: { uid: string; email?: string; displayName?: string }[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
      const page = await firebaseAdmin.auth().listUsers(1000, nextPageToken);
      authUsersAccumulator.push(...page.users);
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    for (const authUser of authUsersAccumulator) {
      const uEmail = authUser.email?.toLowerCase();
      if (!uEmail) continue;
      if (!emailToUser.has(uEmail)) {
        // Upsert minimal user into Firestore so it appears in the list
        await createOrUpdateUser({
          email: uEmail,
          name: authUser.displayName || uEmail.split('@')[0],
          authUid: authUser.uid,
        });
      }
    }

    // Re-read after potential upserts
    const users = await getAllUsers();
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
