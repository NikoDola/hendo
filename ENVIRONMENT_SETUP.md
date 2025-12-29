# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Firebase Configuration
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Stripe Configuration
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
```

### Application Configuration
```env
# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Google OAuth Configuration
```env
# Google OAuth (for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Email Configuration
```env
# Proton Mail SMTP (for contact form and newsletter verification emails)
PROTON_SMTP_HOST=smtp.protonmail.ch
PROTON_SMTP_PORT=587
PROTON_SMTP_USER=levelup@thelegendofhendo.com
PROTON_SMTP_TOKEN=your_proton_smtp_token_here
CONTACT_EMAIL=thanzoproject@gmail.com  # Or NEXT_PUBLIC_CONTACT_EMAIL - where contact form emails are sent
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

## How to Get These Values

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Click "Add app" and select Web
6. Copy the configuration values

### Stripe Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your **Secret Key** from Developers > API Keys
3. Get your **Publishable Key** from the same page
4. **Important**: Use test keys for development, live keys for production

### Stripe Test Mode
For testing, use these test keys instead:
```env
# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
```

### Proton Mail SMTP Setup (Contact Form & Newsletter)
1. **Requirements**: You need a paid Proton Mail plan with a custom domain
2. **Get SMTP Token**:
   - Log in to your Proton Mail account
   - Go to: Settings → All settings → Proton Mail → IMAP/SMTP → SMTP tokens
   - Click "Generate token"
   - Name it (e.g., "Contact Form")
   - Select your email address
   - Click "Generate" and confirm with your password
   - **Copy the token immediately** (shown only once)
3. **Add to `.env.local`**:
   - `PROTON_SMTP_USER`: Your Proton email address (e.g., `levelup@thelegendofhendo.com`)
   - `PROTON_SMTP_TOKEN`: The SMTP token you generated
   - `PROTON_SMTP_HOST`: `smtp.protonmail.ch` (default, can be omitted)
   - `PROTON_SMTP_PORT`: `587` (default, can be omitted)
4. **For Contact Form**: Set `CONTACT_EMAIL` or `NEXT_PUBLIC_CONTACT_EMAIL` to the email address where you want to receive contact form submissions
5. **Note**: Contact form emails are sent server-side via Firebase API route using Proton Mail SMTP, so all email sending is secure and handled on the backend

## Security Notes

- **Never commit** `.env.local` to version control
- **Use test keys** during development
- **Switch to live keys** only for production
- **Keep your secret keys** secure and private

## Testing the Setup

1. Start the development server: `npm run dev`
2. Go to `/signup` and create an account with `thelegendofhendo@gmail.com` or `nikodola@gmail.com`
3. You should be redirected to the admin dashboard
4. Create accounts with other emails to test user functionality
5. Test the music store and Stripe integration

## Production Deployment

When deploying to production:
1. Update `NEXT_PUBLIC_BASE_URL` to your production domain
2. Use live Stripe keys
3. Ensure all Firebase settings are configured for production
4. Set up proper CORS and security headers
