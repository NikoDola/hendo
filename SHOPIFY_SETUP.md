# Shopify Integration Setup

To enable Shopify customer creation when users verify their newsletter subscription, you need to set up the following environment variables:

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Admin API Configuration
SHOPIFY_STORE_DOMAIN=your-store-name.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-access-token
```

## How to Get Your Shopify Admin Access Token

1. **Create a Private App in Shopify Admin:**
   - Go to your Shopify admin dashboard
   - Navigate to Settings > Apps and sales channels
   - Click "Develop apps" (or "Manage private apps" in older versions)
   - Click "Create an app"
   - Give it a name like "Newsletter Integration"

2. **Configure App Permissions:**
   - Click "Configure Admin API scopes"
   - Enable the following permissions:
     - `write_customers` - To create customers
     - `read_customers` - To check if customers exist
   - Click "Save"

3. **Install and Get Access Token:**
   - Click "Install app"
   - Copy the "Admin API access token"
   - This is your `SHOPIFY_ADMIN_ACCESS_TOKEN`

## How It Works

1. User subscribes to newsletter → Firebase stores email with verification token
2. User clicks verification link → Firebase marks email as verified
3. **NEW:** System automatically creates Shopify customer with:
   - Random generated password (user won't know it)
   - `accepts_marketing: true`
   - Tags: `newsletter-subscriber`, `hendo-fan`
   - No verification emails sent from Shopify
   - No welcome emails sent from Shopify

## Features

- ✅ Prevents duplicate customers (checks if email exists first)
- ✅ No Shopify verification emails sent to users
- ✅ No Shopify welcome emails sent to users
- ✅ Random secure password generated automatically
- ✅ Proper error handling (Firebase verification still works if Shopify fails)
- ✅ Links Firebase and Shopify records together

## Testing

After setting up the environment variables, test the flow:
1. Subscribe to newsletter
2. Verify email
3. Check your Shopify admin for the new customer
4. Verify no emails were sent from Shopify
