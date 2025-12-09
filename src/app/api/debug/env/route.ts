import { NextResponse } from 'next/server';

// Temporary debug endpoint - DELETE THIS AFTER DEBUGGING
export async function GET() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Check private key format without exposing it
  let privateKeyStatus = 'Missing';
  let privateKeyDetails = {};

  if (privateKey) {
    privateKeyDetails = {
      length: privateKey.length,
      startsWithQuote: privateKey.startsWith('"'),
      endsWithQuote: privateKey.endsWith('"'),
      hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
      hasEscapedNewlines: privateKey.includes('\\n'),
      hasRealNewlines: privateKey.includes('\n') && !privateKey.includes('\\n'),
      first50Chars: privateKey.substring(0, 50).replace(/./g, (c) => {
        // Show structure but mask the actual key content
        if (c === '-' || c === ' ' || c === 'B' || c === 'E' || c === 'G' || c === 'I' || c === 'N' || c === 'P' || c === 'R' || c === 'V' || c === 'A' || c === 'T' || c === 'K' || c === 'Y') return c;
        if (c === '\n') return '↵';
        if (c === '\\') return '\\';
        return '*';
      }),
    };

    if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && privateKey.includes('-----END PRIVATE KEY-----')) {
      privateKeyStatus = 'Valid format';
    } else {
      privateKeyStatus = 'Invalid format';
    }
  }

  return NextResponse.json({
    status: 'Debug info',
    environment: process.env.NODE_ENV,
    variables: {
      FIREBASE_PROJECT_ID: projectId ? `✓ Set (${projectId})` : '✗ Missing',
      FIREBASE_CLIENT_EMAIL: clientEmail ? `✓ Set (${clientEmail})` : '✗ Missing',
      FIREBASE_PRIVATE_KEY: privateKeyStatus,
      privateKeyDetails,
    },
    note: 'DELETE THIS ENDPOINT AFTER DEBUGGING - /api/debug/env'
  });
}
