# Music Admin Panel - Complete Guide

## 🎵 Overview
I've completely removed Shopify and created a Firebase-based admin panel for music management. The system allows authorized admins to upload, edit, and manage music tracks with full file storage capabilities.

## 🔐 Admin Authentication

### Security Features
- **Email Domain Restriction**: Only `@nikodola.com` emails can access the admin panel
- **Cookie-based Sessions**: Secure HTTP-only cookies for session management
- **Automatic Logout**: Sessions expire after 7 days
- **Access Logging**: All admin access is tracked in Firebase

### Login Process
1. Go to `/admin/login`
2. Enter your `@nikodola.com` email
3. Optionally enter your display name
4. System automatically creates admin account if first time

## 🎶 Music Management Features

### Upload Music Tracks
- **Title**: Music track title
- **Description**: Detailed description
- **Hashtags**: Comma-separated hashtags with visual tags
- **Price**: Set price in USD
- **Audio File**: Upload any audio format
- **PDF Rights**: Optional PDF for music rights documentation

### Hashtag System
- **Smart Input**: Type hashtags and press comma to add
- **Visual Tags**: See all hashtags as removable tags
- **Delete Tags**: Click "X" to remove unwanted hashtags
- **Validation**: At least one hashtag required

### Edit Music Tracks
- **Same Interface**: Edit form uses same interface as upload
- **Selective Updates**: Only changed fields are updated
- **File Replacement**: Can replace audio or PDF files
- **Preserve Data**: Unchanged data remains intact

### Music List Management
- **Visual Cards**: Each track displayed in a clean card layout
- **Play/Pause**: Built-in audio player for each track
- **Download**: Direct download links for audio files
- **PDF Viewer**: Open PDF rights documents in new tab
- **Edit/Delete**: Quick action buttons for each track
- **Price Display**: Clear pricing information
- **Metadata**: Creation date and admin who uploaded

## 🗂️ File Storage

### Firebase Storage Integration
- **Audio Files**: Stored in `music/` folder with timestamps
- **PDF Files**: Stored in `music/pdfs/` folder
- **Automatic Cleanup**: Old files deleted when replaced
- **Secure URLs**: Direct download links with proper permissions

### File Management
- **Unique Names**: Timestamped filenames prevent conflicts
- **Format Support**: Any audio format, PDF for rights
- **Size Handling**: No arbitrary size limits (Firebase limits apply)
- **Error Handling**: Graceful handling of upload failures

## 🎨 User Interface

### Design Features
- **Consistent Styling**: Matches your existing design system
- **Responsive Layout**: Works on desktop and mobile
- **Loading States**: Visual feedback during operations
- **Error Handling**: Clear error messages for users
- **Confirmation Dialogs**: Safety prompts for destructive actions

### Navigation
- **Header Bar**: Shows admin email and logout option
- **Main Dashboard**: List of all music tracks
- **Upload Button**: Prominent button to add new tracks
- **Quick Actions**: Edit/delete buttons on each track

## 🔧 Technical Implementation

### Firebase Collections
- **`admins`**: Admin user accounts and permissions
- **`music`**: Music track metadata and file references
- **`subscribers`**: Newsletter subscribers (existing)

### API Endpoints
- **`/api/admin/auth`**: Authentication and session management
- **`/api/admin/music`**: CRUD operations for music tracks
- **`/api/admin/music/[id]`**: Individual track operations

### Security Measures
- **Server-side Validation**: All operations validated on server
- **File Type Checking**: Proper MIME type validation
- **Access Control**: Every API call checks admin authentication
- **Error Sanitization**: No sensitive data in error messages

## 🚀 Getting Started

### 1. Environment Setup
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Storage Rules
Update your Firebase Storage rules to allow admin uploads:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /music/{allPaths=**} {
      allow read: if true; // Public read for music files
      allow write: if request.auth != null && 
        request.auth.token.email.matches('.*@nikodola\\.com$');
    }
  }
}
```

### 3. Access the Admin Panel
1. Navigate to `/admin/login`
2. Use your `@nikodola.com` email
3. Start uploading and managing music!

## 📱 Usage Examples

### Uploading a New Track
1. Click "Upload New Track"
2. Fill in title: "Smooth Jazz Vibes"
3. Add description: "Relaxing jazz instrumental"
4. Add hashtags: "jazz, smooth, instrumental, relaxing"
5. Set price: $9.99
6. Upload audio file
7. Upload PDF rights document (optional)
8. Click "Upload Music"

### Editing a Track
1. Click edit button on any track
2. Modify any field you want to change
3. Upload new audio file if needed
4. Click "Update Music"

### Managing Hashtags
- Type "chill, ambient" and press comma
- See tags appear as blue pills
- Click "X" on any tag to remove it
- Add more by typing and pressing comma

## 🔒 Security Notes

- **Admin Only**: Only `@nikodola.com` emails can access
- **Session Security**: HTTP-only cookies prevent XSS
- **File Validation**: Server-side file type checking
- **Access Logging**: All admin actions are logged
- **Automatic Cleanup**: Old files are properly deleted

## 🎯 Next Steps

The admin panel is fully functional and ready to use! You can:
1. Start uploading your music tracks
2. Set up your pricing
3. Organize with hashtags
4. Manage your music library
5. Handle rights documentation

All data is stored securely in Firebase and the interface is intuitive and professional.
