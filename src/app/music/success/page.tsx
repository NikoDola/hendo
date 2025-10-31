'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, FileText } from 'lucide-react';

export default function PaymentSuccess() {
  const [downloadData, setDownloadData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId);
    }
  }, [sessionId]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setDownloadData(data);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your music track is ready for download.
        </p>
        
        {downloadData && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Download Links</h3>
              <div className="space-y-2">
                <a
                  href={downloadData.downloadUrl}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download size={20} />
                  Download Music Track
                </a>
                <a
                  href={downloadData.pdfUrl}
                  className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <FileText size={20} />
                  Download Rights PDF
                </a>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Downloads expire on: {new Date(downloadData.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <a
            href="/music"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Browse More Music
          </a>
        </div>
      </div>
    </div>
  );
}
