import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once per server runtime
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // Handle private key - try multiple formats
  let privateKey = rawKey;
  if (rawKey) {
    // If it contains literal \n (escaped), replace with actual newlines
    if (rawKey.includes('\\n')) {
      privateKey = rawKey.replace(/\\n/g, '\n');
    }
    // If wrapped in quotes, remove them
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Ensure it has the proper format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('Firebase Admin: Private key appears malformed - missing BEGIN marker');
    }
  }

  // Debug logging (remove in production if sensitive)

  try {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

    if (projectId && clientEmail && privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        projectId,
        storageBucket,
      });
    } else {
      console.error('Firebase Admin: Missing or invalid credentials');
      // Fallback: try ADC if a service account json is configured
      const inferredProjectId = projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (inferredProjectId && !process.env.GOOGLE_CLOUD_PROJECT) {
        process.env.GOOGLE_CLOUD_PROJECT = inferredProjectId;
      }
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: inferredProjectId,
          storageBucket,
        });
        console.warn('Firebase Admin: using applicationDefault credentials with bucket:', storageBucket);
      } catch (adcError) {
        console.error('Firebase Admin: ADC fallback also failed:', adcError);
      }
    }
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

export const firebaseAdmin = admin;


