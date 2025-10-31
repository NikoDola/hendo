import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once per server runtime
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\n') ? rawKey : rawKey.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else {
      // Fallback: try ADC if a service account json is configured
      const inferredProjectId = projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (inferredProjectId && !process.env.GOOGLE_CLOUD_PROJECT) {
        process.env.GOOGLE_CLOUD_PROJECT = inferredProjectId;
      }
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: inferredProjectId,
      });
      console.warn('Firebase Admin: using applicationDefault credentials.');
    }
  } catch (e) {
    console.warn('Firebase Admin initialization failed:', e);
  }
}

export const firebaseAdmin = admin;


