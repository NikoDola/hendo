# Domain Migration Guide: nebulaclouds.com → thelegendofhendo.com

## Overview
This guide will help you migrate your Shopify store and Google OAuth configuration from `nebulaclouds.com` to `thelegendofhendo.com`.

## 1. Update Environment Variables

Update your `.env.local` file with the new domain:

```env
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=thelegendofhendo.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_access_token
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 2. Update Google Cloud Console

### Add Multiple Redirect URIs:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add these authorized redirect URIs:
   - `https://thelegendofhendo.com/auth/google/callback` (primary domain)
   - `https://nebulaclouds.com/auth/google/callback` (secondary domain)
   - `http://localhost:3000/auth/google/callback` (for development)
5. Save the changes

**Note:** You can add as many domains as you want to support multiple domains on the same Shopify store.

## 3. Update Shopify Store Settings

### In Shopify Admin:
1. Go to **Settings** > **General**
2. Update **Store address** to use `thelegendofhendo.com`
3. Go to **Settings** > **Customer accounts**
4. Update any email templates to use the new domain
5. Check **Settings** > **Notifications** for email templates

### Update Shopify Storefront API:
1. Go to **Apps** > **Develop apps**
2. Find your Storefront API app
3. Update the **Allowed domains** to include:
   - `thelegendofhendo.com`
   - `www.thelegendofhendo.com`
   - `localhost:3000` (for development)

## 4. Update DNS and Hosting

### If using custom domain:
1. Update your DNS records to point to your hosting provider
2. Ensure SSL certificate is configured for `thelegendofhendo.com`
3. Update your hosting provider's domain settings

### If using Shopify's built-in domain:
1. Go to **Online Store** > **Domains**
2. Add `thelegendofhendo.com` as a custom domain
3. Follow Shopify's domain setup instructions

## 5. Test the Migration

### Test Google OAuth:
1. **Development**: `http://localhost:3000/login`
2. **Production**: `https://thelegendofhendo.com/login`
3. Click "Login with Google" and verify redirect works

### Test Customer Verification:
1. Create a test customer account
2. Check that verification emails come from `thelegendofhendo.com`
3. Verify that verification links redirect to the correct domain

## 6. Clean Up (After Testing)

### Remove Old Domain from Google Console:
1. Go back to Google Cloud Console
2. Remove `nebulaclouds.com` redirect URIs
3. Keep only the new domain URIs

### Update Shopify Settings:
1. Remove old domain from allowed domains
2. Update any remaining references to the old domain

## 7. Important Notes

### Email Verification Links:
- Shopify will automatically use your configured domain for verification emails
- Make sure your domain is properly configured in Shopify admin

### OAuth Redirects:
- Google OAuth will now redirect to `thelegendofhendo.com/auth/google/callback`
- Make sure this URL is accessible and working

### SSL Certificate:
- Ensure `thelegendofhendo.com` has a valid SSL certificate
- Google OAuth requires HTTPS for production domains

## 8. Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**
   - Check that `https://thelegendofhendo.com/auth/google/callback` is added to Google Console
   - Verify the domain is accessible

2. **Verification emails still use old domain**
   - Check Shopify admin settings
   - Clear any caches
   - Wait a few minutes for changes to propagate

3. **OAuth callback not working**
   - Verify the domain is accessible
   - Check SSL certificate is valid
   - Ensure the callback route is working

## 9. Files Modified

The following files have been updated to use the new domain:

- `src/lib/shopify/admin.ts` - Updated default domain
- `src/lib/shopify/googleAuth.ts` - Updated OAuth redirect URI logic

## 10. Next Steps

1. Update your `.env.local` file with the new domain
2. Update Google Cloud Console with new redirect URIs
3. Update Shopify store settings
4. Test the migration thoroughly
5. Clean up old domain references

## Support

If you encounter any issues during the migration, check:
- Domain DNS settings
- SSL certificate validity
- Google OAuth configuration
- Shopify store settings
- Environment variables
