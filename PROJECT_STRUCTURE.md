# Project Structure - Refactored Architecture

This document explains the new, clean architecture following industry best practices.

## 📁 Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin pages
│   │   ├── dashboard/            # Admin dashboard (refactored to 147 lines)
│   │   └── login/                # Admin login
│   ├── dashboard/                # User dashboard (refactored to 112 lines)
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── music/                # Music endpoints
│   │   ├── stripe/               # Payment endpoints
│   │   └── user/                 # User endpoints
│   └── ...                       # Other pages
│
├── components/                   # React components
│   ├── features/                 # Feature-specific components
│   │   ├── admin/                # Admin components
│   │   │   ├── AdminHeader.tsx           (37 lines)
│   │   │   ├── AdminSidebar.tsx          (34 lines)
│   │   │   ├── AdminUsersList.tsx        (134 lines)
│   │   │   ├── AdminMusicTracksList.tsx  (71 lines)
│   │   │   ├── AdminMusicTrackForm.tsx   (169 lines)
│   │   │   └── index.ts
│   │   ├── user/                 # User components
│   │   │   ├── UserProfile.tsx           (81 lines)
│   │   │   ├── UserPurchasesList.tsx     (87 lines)
│   │   │   └── index.ts
│   │   └── music/                # Music components
│   │       ├── MusicCardVisualizer.tsx   (47 lines)
│   │       └── index.ts
│   ├── ui/                       # Reusable UI components
│   │   ├── ProfileDropdown.tsx   (19 lines)
│   │   └── index.ts
│   ├── client/                   # Client-side components
│   │   ├── backgrounds/          # Background effects
│   │   └── ...
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── useUsers.ts               (43 lines) - User management
│   ├── useMusicTracks.ts         (46 lines) - Track management
│   ├── usePurchases.ts           (41 lines) - Purchase management
│   ├── useMouse.ts               (16 lines) - Mouse tracking
│   ├── useForm.ts                (66 lines) - Form state management
│   ├── useDownload.ts            (49 lines) - File downloads
│   ├── useAudioPlayer.ts         (73 lines) - Audio playback
│   ├── useAudioAnalysis.ts       (113 lines) - Audio visualization
│   └── index.ts                  # Exports
│
├── services/                     # Business logic layer
│   ├── auth.service.ts           (329 lines) - Authentication service
│   ├── music.service.ts          (222 lines) - Music management service
│   └── index.ts                  # Exports
│
├── lib/                          # Legacy lib (re-exports services)
│   ├── auth.ts                   (2 lines) - Re-export from service
│   ├── music.ts                  (2 lines) - Re-export from service
│   ├── firebase/                 # Firebase configuration
│   └── ...
│
├── middleware/                   # API middleware
│   ├── api.middleware.ts         (74 lines) - Auth & error handling
│   └── index.ts
│
├── utils/                        # Utility functions
│   ├── api.utils.ts              (48 lines) - API utilities
│   ├── validation.ts             (53 lines) - Validation utilities
│   └── index.ts
│
├── context/                      # React Context providers
│   └── UserAuthContext.tsx       (175 lines) - Auth context
│
└── types/                        # TypeScript type definitions
    └── ...
```

## 🎯 Key Improvements

### 1. **Separation of Concerns**
- **Services**: Business logic and data operations
- **Hooks**: React state management and side effects
- **Components**: Pure UI components
- **Utils**: Helper functions
- **Middleware**: API request/response handling

### 2. **File Size Reduction**
Before vs After:
- `AdminDashboard.tsx`: 792 lines → 147 lines + 5 components
- `UserDashboard.tsx`: 313 lines → 112 lines + 2 components
- `auth.ts`: 350 lines → 329 lines (service) + clean structure
- `music.ts`: 319 lines → 222 lines (service) + better organization

### 3. **Reusability**
- Custom hooks can be used across multiple components
- Services can be called from any API route or component
- UI components are isolated and testable

### 4. **Maintainability**
- Each file has a single responsibility
- Easy to locate and modify specific functionality
- Clear import paths with index files

## 📚 Architecture Layers

### Layer 1: Services (Business Logic)
```typescript
src/services/
├── auth.service.ts      # User authentication & management
└── music.service.ts     # Music track operations
```

**Purpose**: Handle all business logic and data operations.
**Examples**: 
- `createMusicTrack()` - Creates a track with file uploads
- `authenticateUser()` - Validates credentials
- `getUserFromSession()` - Retrieves user from session cookie

### Layer 2: Hooks (State Management)
```typescript
src/hooks/
├── useUsers.ts          # Manage users list
├── useMusicTracks.ts    # Manage tracks list
├── usePurchases.ts      # Manage purchases
└── useForm.ts           # Form state management
```

**Purpose**: Manage React state and side effects.
**Examples**:
- `useUsers()` - Provides users array, loading state, and CRUD operations
- `useForm()` - Handles form state, validation, and submission

### Layer 3: Components (UI)
```typescript
src/components/
├── features/            # Feature-specific components
├── ui/                  # Reusable UI components
└── client/              # Client-side effects
```

**Purpose**: Render UI and handle user interactions.
**Best Practices**:
- Keep components under 180 lines
- Extract complex logic into hooks
- Use composition over inheritance

### Layer 4: Middleware (API Layer)
```typescript
src/middleware/
└── api.middleware.ts    # withAuth, withAdmin, withErrorHandler
```

**Purpose**: Handle cross-cutting concerns in API routes.
**Examples**:
- `withAuth()` - Ensures user is authenticated
- `withAdmin()` - Ensures user has admin role
- `withErrorHandler()` - Catches and formats errors

## 🔄 Data Flow

```
User Interaction
    ↓
Component (uses Hook)
    ↓
Hook (calls Service)
    ↓
Service (performs operation)
    ↓
Service (returns data)
    ↓
Hook (updates state)
    ↓
Component (re-renders)
```

## 📝 Best Practices Implemented

1. **Single Responsibility Principle**: Each file/function does one thing well
2. **DRY (Don't Repeat Yourself)**: Common logic extracted into hooks/services
3. **Composition**: Small, reusable components composed together
4. **Type Safety**: Full TypeScript coverage with proper types
5. **Error Handling**: Centralized error handling in middleware
6. **Code Organization**: Clear folder structure with index files
7. **File Size**: No file exceeds 180 lines (except some legacy components)

## 🚀 Usage Examples

### Using a Hook
```typescript
import { useUsers } from '@/hooks/useUsers';

function MyComponent() {
  const { users, loading, deleteUser } = useUsers();
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onDelete={() => deleteUser(user.id)} 
        />
      ))}
    </div>
  );
}
```

### Using a Service
```typescript
import { authenticateUser } from '@/services/auth.service';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await authenticateUser({ email, password });
  return NextResponse.json({ user });
}
```

### Using Middleware
```typescript
import { withAdmin, withErrorHandler, composeMiddleware } from '@/middleware';

const handler = composeMiddleware(
  withErrorHandler,
  withAdmin
)(async (request) => {
  // Only admins can access this
  return NextResponse.json({ success: true });
});

export const GET = handler;
```

## 🎨 Styling

All styles remain unchanged. CSS modules and global styles are preserved.

## 🔧 Migration Notes

- All old imports from `@/lib/auth` and `@/lib/music` still work (they re-export from services)
- New code should import from `@/services/` directly
- Components can be imported from feature folders or via index files

## 📖 Further Reading

- [React Hooks Documentation](https://react.dev/reference/react)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

