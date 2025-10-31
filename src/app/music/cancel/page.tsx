'use client';

import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="mx-auto text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/music"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Music Store
          </Link>
        </div>
      </div>
    </div>
  );
}
