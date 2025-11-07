'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/client/Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer only on the root path (under construction page)
  if (pathname === '/') {
    return null;
  }
  
  return <Footer />;
}

