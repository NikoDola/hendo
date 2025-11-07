'use client';

import { usePathname } from 'next/navigation';
import NavBar from '@/components/client/NavBar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar only on the root path (under construction page)
  if (pathname === '/') {
    return null;
  }
  
  return <NavBar />;
}

