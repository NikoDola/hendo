'use client';

import Link from 'next/link';
import { XCircle, Home, Music } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="mx-auto text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/music"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Music size={20} />
            Continue Shopping
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            <Home size={20} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
