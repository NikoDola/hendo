'use client';

import Footer from '@/components/client/Footer';
import { usePathname } from 'next/navigation';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide contact form on auth pages and admin dashboard.
  const hideContact =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/admin/dashboard';

  return <Footer showContact={!hideContact} />;
}

