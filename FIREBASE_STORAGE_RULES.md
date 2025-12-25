# Firebase Storage Security Rules

## Current Rules
The rules allow:
- **Public read access** to `music/` folder (for music previews)
- **Admin write access** to `music/` folder (only `@nikodola.com`, `thelegendofhendo@gmail.com`, or `nikodola@gmail.com`)
- **Authenticated users** can read their own files in `purchases/{userId}/` folder
- **Server-only writes** to `purchases/` folder (users cannot write directly)

## How to Update Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`t-hendo`)
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Copy and paste the contents of `storage.rules` into the editor
6. Click **Publish**

## Rules Explanation

### Music Files
```
match /music/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null && 
    (request.auth.token.email.matches('.*@nikodola\\.com$') ||
     request.auth.token.email.matches('.*thelegendofhend@gmail\\.com$') ||
     request.auth.token.email.matches('.*nikodola@gmail\\.com$'));
}
```
- Anyone can read music files (for previews)
- Only admins can upload/edit music files

### Purchased Files
```
match /purchases/{userId}/{allPaths=**} {
  allow read: if request.auth != null && 
    request.auth.uid == userId;
  allow write: if false;
}
```
- Users can only read files in their own `purchases/{userId}/` folder
- Only the server (using admin SDK) can write purchases
- This ensures users can download their purchased tracks but cannot access others' purchases

## Testing Rules

You can test rules in the Firebase Console:
1. Go to Storage → Rules tab
2. Click "Simulator" 
3. Try different scenarios:
   - Authenticated user reading their own purchase: ✅ Should allow
   - Unauthenticated user reading purchase: ❌ Should deny
   - User trying to read another user's purchase: ❌ Should deny

