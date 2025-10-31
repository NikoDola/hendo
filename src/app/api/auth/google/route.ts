import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/callback`;

    // Use the correct OAuth 2.0 endpoint
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('include_granted_scopes', 'true');
    googleAuthUrl.searchParams.set('state', 'random_state_string'); // TODO: replace with secured state
    
    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Google OAuth failed' },
      { status: 500 }
    );
  }
}
