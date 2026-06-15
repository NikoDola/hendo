'use client';

import { usePathname } from 'next/navigation';
import NavBar from '@/components/client/NavBar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on the root path (under construction page) and the admin login page.
  if (pathname === '/' || pathname === '/admin/login') {
    return null;
  }
  
  return <NavBar />;
}

