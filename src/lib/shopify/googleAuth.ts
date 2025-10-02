// Google OAuth integration for Shopify
import { ShopifyStorefrontClient } from './storefront';
import { syncShopifyCustomerToFirebase } from '@/lib/firebase-shopify-sync';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

if (!GOOGLE_CLIENT_ID) {
  throw new Error('Missing Google OAuth Client ID');
}

if (!SHOPIFY_STORE_DOMAIN) {
  throw new Error('Missing Shopify Store Domain');
}

// Google OAuth configuration
const getGoogleOAuthConfig = () => {
  // Get the current origin, with fallback for development
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Support multiple production domains
  const supportedDomains = [
    'thelegendofhendo.com',
    'nebulaclouds.com'
  ];

  let redirectUri;
  if (origin.includes('localhost')) {
    redirectUri = `${origin}/auth/google/callback`;
  } else {
    // Use the current domain if it's one of our supported domains
    const currentDomain = origin.replace('https://', '').replace('http://', '');
    if (supportedDomains.some(domain => currentDomain.includes(domain))) {
      redirectUri = `${origin}/auth/google/callback`;
    } else {
      // Default to thelegendofhendo.com
      redirectUri = `https://thelegendofhendo.com/auth/google/callback`;
    }
  }

  return {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  };
};

/**
 * Initiates Google OAuth flow
 */
export function initiateGoogleAuth(isLogin: boolean = false) {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    throw new Error('Google OAuth can only be initiated in the browser');
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const config = getGoogleOAuthConfig();

  Object.entries(config).forEach(([key, value]) => {
    authUrl.searchParams.set(key, value);
  });

  // Add state parameter for security
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Store state in localStorage with timestamp and login/signup flag
  const stateData = {
    state: state,
    timestamp: Date.now(),
    origin: window.location.origin,
    isLogin: isLogin
  };

  localStorage.setItem('google_oauth_state', JSON.stringify(stateData));
  authUrl.searchParams.set('state', state);

  // Redirect to Google OAuth
  window.location.href = authUrl.toString();
}

/**
 * Handles Google OAuth callback
 */
export async function handleGoogleCallback(code: string, state: string) {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    throw new Error('Google OAuth callback can only be handled in the browser');
  }

  // Verify state parameter with better debugging
  const storedStateData = localStorage.getItem('google_oauth_state');

  console.log('OAuth State Debug - Raw stored data:', storedStateData);

  if (!storedStateData) {
    console.error('No stored state found');
    throw new Error('No stored OAuth state found. Please try again.');
  }

  let storedState;
  let isLogin = false;
  try {
    const parsed = JSON.parse(storedStateData);
    storedState = parsed.state;
    isLogin = parsed.isLogin || false;

    // Check if state is not too old (5 minutes)
    const isExpired = Date.now() - parsed.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      console.error('State expired');
      throw new Error('OAuth session expired. Please try again.');
    }
  } catch (e) {
    // Fallback for old format
    storedState = storedStateData;
  }

  console.log('OAuth State Debug:', {
    receivedState: state,
    storedState: storedState,
    match: state === storedState
  });

  if (state !== storedState) {
    console.error('State mismatch:', {
      received: state,
      stored: storedState,
      localStorage: typeof localStorage !== 'undefined'
    });
    throw new Error('Invalid state parameter. Please try again.');
  }

  // Clear state from localStorage AFTER successful verification
  localStorage.removeItem('google_oauth_state');

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('/api/auth/google/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: getGoogleOAuthConfig().redirect_uri })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
    const userInfo = await userResponse.json();

    // Create or login customer in Shopify
    return await createOrLoginCustomerWithGoogle(userInfo, isLogin);
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
}

/**
 * Creates or logs in a customer using Google OAuth data
 */
async function createOrLoginCustomerWithGoogle(googleUser: {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}, isLogin: boolean = false) {
  const client = new ShopifyStorefrontClient();

  try {
    // Create a unique password for this Google user
    const googlePassword = `google_${googleUser.id}_${Date.now()}`;

    // First, try to create the customer
    const createResponse = await client.request(`
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `, {
      input: {
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        password: googlePassword,
        acceptsMarketing: false
      }
    });

    // Check if customer creation was successful
    if (createResponse.customerCreate.customerUserErrors.length > 0) {
      const error = createResponse.customerCreate.customerUserErrors[0];

      console.log('Customer creation error:', error);

      if (error.code === 'TAKEN' || error.message.includes('email') || error.message.includes('taken')) {
        // Customer already exists, try to login with the existing account
        console.log('Customer already exists, attempting to login...');

        // Try to login with the existing customer
        const loginResponse = await client.request(`
          mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
            customerAccessTokenCreate(input: $input) {
              customerAccessToken {
                accessToken
                expiresAt
              }
              customerUserErrors {
                code
                field
                message
              }
            }
          }
        `, {
          input: {
            email: googleUser.email,
            password: googlePassword
          }
        });

        if (loginResponse.customerAccessTokenCreate.customerUserErrors.length > 0) {
          // If login fails, the customer exists but we can't login with Google password
          // This means the customer was created through regular signup, not Google OAuth
          console.log('Customer exists but Google OAuth login failed');

          if (isLogin) {
            // For login: just tell them to use regular login
            throw new Error('An account with this email already exists. Please use regular login instead of Google sign-in.');
          } else {
            // For signup: show popup asking if they want to login
            throw new Error('EXISTING_ACCOUNT_NEEDS_LOGIN');
          }
        }

        return loginResponse.customerAccessTokenCreate.customerAccessToken;
      } else {
        console.error('Customer creation failed:', error);
        throw new Error(`Customer creation failed: ${error.message}`);
      }
    }

    // If customer was created successfully, create access token
    const loginResponse = await client.request(`
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `, {
      input: {
        email: googleUser.email,
        password: googlePassword
      }
    });

    if (loginResponse.customerAccessTokenCreate.customerUserErrors.length > 0) {
      throw new Error(loginResponse.customerAccessTokenCreate.customerUserErrors[0].message);
    }

    const accessToken = loginResponse.customerAccessTokenCreate.customerAccessToken;

    // Sync to Firebase for new customers
    if (createResponse.customerCreate.customer) {
      try {
        await syncShopifyCustomerToFirebase({
          email: googleUser.email,
          first_name: googleUser.given_name,
          last_name: googleUser.family_name,
          id: createResponse.customerCreate.customer.id
        });
        console.log('Successfully synced Google OAuth customer to Firebase');
      } catch (syncError) {
        console.error('Failed to sync Google OAuth customer to Firebase:', syncError);
        // Don't fail the OAuth flow if Firebase sync fails
      }
    }

    return accessToken;
  } catch (error) {
    console.error('Error creating/logging in customer:', error);
    throw error;
  }
}

/**
 * Finds customer by email using Shopify Admin API
 */
async function findCustomerByEmail(email: string) {
  // This would require Admin API access
  // For now, we'll assume customer doesn't exist and create new one
  return null;
}

/**
 * Generates a random password for Google OAuth users
 */
function generateRandomPassword(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
