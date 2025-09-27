# Multi-Domain Next.js + Shopify Setup Guide

## Overview
This guide shows how to run multiple domains (thelegendofhendo.com + nebulaclouds.com) with one Next.js app connected to the same Shopify store.

## ✅ Yes, This Setup Works Perfectly!

### **Architecture:**
```
thelegendofhendo.com → Next.js App → Shopify Store
nebulaclouds.com → Same Next.js App → Same Shopify Store
```

## 🚀 Implementation Options

### **Option 1: Single Next.js App (Recommended)**

#### **Benefits:**
- ✅ One codebase to maintain
- ✅ Shared components and logic
- ✅ Easy to deploy and update
- ✅ Cost-effective hosting

#### **How It Works:**
1. **Domain Detection**: App detects which domain user is on
2. **Dynamic Content**: Shows different branding/content per domain
3. **Shared Backend**: Same Shopify store, same authentication
4. **Flexible Theming**: Different colors, logos, content per domain

### **Option 2: Multiple Next.js Apps**

#### **Benefits:**
- ✅ Complete separation of domains
- ✅ Independent deployments
- ✅ Different tech stacks per domain

#### **How It Works:**
1. **Separate Apps**: Each domain has its own Next.js app
2. **Shared API**: Both apps connect to same Shopify store
3. **Independent Deployments**: Deploy each app separately

## 🔧 Implementation (Option 1 - Recommended)

### **1. Domain Detection System**

I've created a domain detection system that automatically adapts your app:

```typescript
// src/lib/domain-detection.ts
export function getCurrentDomain(): 'thelegendofhendo' | 'nebulaclouds' | 'localhost'
export function getDomainConfig(): DomainConfig
export function isHendoDomain(): boolean
export function isNebulaDomain(): boolean
```

### **2. Adaptive Components**

```jsx
// Components that change based on domain
<DomainAdaptiveHeader />
<DomainAdaptiveFooter />
<DomainAdaptiveProductGrid />
```

### **3. Dynamic Styling**

```css
/* Different themes per domain */
.hendo-theme { --primary-color: #FF6B6B; }
.nebula-theme { --primary-color: #4ECDC4; }
```

## 📋 Setup Steps

### **1. Update Your Layout**

```jsx
// src/app/layout.tsx
import { getDomainConfig } from '@/lib/domain-detection';

export default function RootLayout({ children }) {
  const domainConfig = getDomainConfig();
  
  return (
    <html lang="en" data-theme={domainConfig.theme}>
      <head>
        <title>{domainConfig.displayName}</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### **2. Update Your Components**

```jsx
// src/components/ProductGrid.tsx
import { isHendoDomain, isNebulaDomain } from '@/lib/domain-detection';

export default function ProductGrid() {
  const isHendo = isHendoDomain();
  const isNebula = isNebulaDomain();
  
  return (
    <div className="product-grid">
      {isHendo && <HendoProductLayout />}
      {isNebula && <NebulaProductLayout />}
    </div>
  );
}
```

### **3. Update Your Pages**

```jsx
// src/app/page.tsx
import { getDomainConfig } from '@/lib/domain-detection';

export default function HomePage() {
  const domainConfig = getDomainConfig();
  
  return (
    <div>
      <h1>Welcome to {domainConfig.displayName}</h1>
      {/* Domain-specific content */}
    </div>
  );
}
```

## 🌐 Deployment Options

### **Option A: Single Deployment**

#### **Vercel/Netlify Setup:**
1. Deploy your Next.js app once
2. Configure both domains to point to the same deployment
3. App automatically detects domain and shows appropriate content

#### **Domain Configuration:**
```
thelegendofhendo.com → your-app.vercel.app
nebulaclouds.com → your-app.vercel.app
```

### **Option B: Multiple Deployments**

#### **Separate Deployments:**
```
thelegendofhendo.com → app-1.vercel.app
nebulaclouds.com → app-2.vercel.app
```

## 🔧 Google OAuth Configuration

### **Update Google Cloud Console:**
Add both domains as redirect URIs:
```
✅ https://thelegendofhendo.com/auth/google/callback
✅ https://nebulaclouds.com/auth/google/callback
✅ http://localhost:3000/auth/google/callback
```

### **OAuth Code Already Updated:**
Your `googleAuth.ts` already supports multiple domains automatically!

## 📱 Content Customization

### **Domain-Specific Content:**

```jsx
// Different content per domain
{isHendoDomain() && (
  <div>
    <h1>The Legend of Hendo</h1>
    <p>Discover the epic tale...</p>
  </div>
)}

{isNebulaDomain() && (
  <div>
    <h1>Nebula Clouds</h1>
    <p>Advanced cloud solutions...</p>
  </div>
)}
```

### **Shared Content:**
```jsx
// Content that's the same on both domains
<ProductGrid products={products} />
<CartComponent />
<CheckoutFlow />
```

## 🎨 Theming System

### **CSS Variables:**
```css
:root {
  --primary-color: #FF6B6B; /* Hendo */
  --secondary-color: #4ECDC4; /* Nebula */
}

.hendo-theme {
  --primary-color: #FF6B6B;
  --accent-color: #FFE66D;
}

.nebula-theme {
  --primary-color: #4ECDC4;
  --accent-color: #45B7D1;
}
```

## 🚀 Benefits of This Setup

### **For Development:**
- ✅ One codebase to maintain
- ✅ Shared components and logic
- ✅ Easy testing across domains
- ✅ Consistent user experience

### **For Business:**
- ✅ Multiple brand identities
- ✅ Different target audiences
- ✅ SEO benefits from multiple domains
- ✅ Cost-effective hosting

### **For Users:**
- ✅ Seamless experience across domains
- ✅ Same cart and authentication
- ✅ Consistent functionality

## 🔍 Testing

### **Local Development:**
```bash
# Test both domains locally
npm run dev
# Visit: http://localhost:3000 (simulates thelegendofhendo.com)
# Visit: http://localhost:3001 (simulates nebulaclouds.com)
```

### **Production Testing:**
1. Deploy to staging
2. Test both domains
3. Verify OAuth works on both
4. Check domain-specific content

## 📋 Next Steps

1. **Update your layout** to use domain detection
2. **Add domain-specific components** where needed
3. **Configure your hosting** for multiple domains
4. **Test both domains** thoroughly
5. **Deploy and go live!**

## 🎯 Result

You'll have:
- ✅ One Next.js app serving both domains
- ✅ Different branding/content per domain
- ✅ Same Shopify store and authentication
- ✅ Google OAuth working on both domains
- ✅ Easy maintenance and updates

**This setup gives you the best of both worlds: multiple domains with shared infrastructure!** 🎉

