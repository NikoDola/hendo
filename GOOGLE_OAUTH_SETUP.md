# Google OAuth Setup Guide for Shopify

## Overview
I've implemented Google OAuth authentication for your Shopify store. The Google login buttons now have proper functionality and will redirect users through Google's OAuth flow.

## What I've Added

### 1. Google OAuth Implementation
- **File**: `src/lib/shopify/googleAuth.ts` - Core Google OAuth logic
- **File**: `src/app/api/auth/google/token/route.ts` - API route for token exchange
- **File**: `src/app/auth/google/callback/page.tsx` - Handles OAuth callback

### 2. Updated Login/Signup Pages
- Added `onClick` handlers to Google login buttons
- Imported Google OAuth functions
- Added error handling for Google authentication

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```env
# Shopify Configuration (you should already have these)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token

# Google OAuth Configuration (NEW - you need to set these up)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Google OAuth Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add these authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
7. Copy the **Client ID** and **Client Secret**

### 2. Configure Shopify (Optional - for built-in social login)

If you want to use Shopify's built-in social login:

1. Go to your Shopify Admin
2. Navigate to **Settings** > **Customer accounts**
3. Click **Manage** in the Authentication section
4. Click **Connect** next to Google
5. Enter your Google OAuth credentials

### 3. Update Environment Variables

Add the Google OAuth credentials to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## How It Works

1. **User clicks "Login with Google"** → Redirects to Google OAuth
2. **User authorizes on Google** → Google redirects back with authorization code
3. **Callback page processes code** → Exchanges code for access token
4. **Gets user info from Google** → Creates/finds customer in Shopify
5. **Logs user in** → Redirects to dashboard

## Testing

1. Start your development server: `npm run dev`
2. Go to `/login` or `/signup`
3. Click "Login with Google" or "Signup with Google"
4. Complete Google OAuth flow
5. You should be redirected to `/dashboard`

## Troubleshooting

### Common Issues:

1. **"Missing Google OAuth Client ID" error**
   - Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
   - Restart your development server after adding environment variables

2. **"Invalid redirect URI" error**
   - Check that your redirect URI in Google Console matches exactly
   - Make sure it includes the full path: `/auth/google/callback`

3. **"Failed to exchange code for token" error**
   - Verify `GOOGLE_CLIENT_SECRET` is set correctly
   - Check that the redirect URI matches in Google Console

4. **Google login button doesn't work**
   - Make sure you've restarted your dev server after adding environment variables
   - Check browser console for any JavaScript errors

## Files Modified/Created

### New Files:
- `src/lib/shopify/googleAuth.ts` - Google OAuth logic
- `src/app/api/auth/google/token/route.ts` - Token exchange API
- `src/app/auth/google/callback/page.tsx` - OAuth callback handler

### Modified Files:
- `src/app/(auth)/login/page.tsx` - Added Google login functionality
- `src/app/(auth)/signup/page.tsx` - Added Google signup functionality

## Next Steps

1. Set up Google OAuth credentials in Google Cloud Console
2. Add environment variables to `.env.local`
3. Test the Google login flow
4. Deploy to production and update redirect URIs

The Google login should now work properly with your Shopify store!
