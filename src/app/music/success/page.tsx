'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, FileText, X } from 'lucide-react';
import Link from 'next/link';
import '@/components/pages/PaymentSuccess.css';

function PaymentSuccessContent() {
  const [downloadData, setDownloadData] = useState<{ downloadUrl: string; pdfUrl: string; trackTitle: string; expiresAt?: string } | null>(null);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      
      if (data.downloadUrl && data.pdfUrl) {
        setDownloadData(data);
        setIsLoading(false);
        
        // Auto-start download after a short delay
        setTimeout(() => {
          startDownloads(data);
        }, 500);
      } else {
        throw new Error('Invalid download data received');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startDownloads = async (data: { downloadUrl: string; pdfUrl: string; trackTitle?: string }) => {
    if (!data.downloadUrl || !data.pdfUrl) return;
    
    try {
      // Download ZIP file - try fetch first, fallback to direct link
      const downloadFile = async (url: string, filename: string) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              window.URL.revokeObjectURL(blobUrl);
            }, 100);
            return true;
          }
        } catch {
          // Fetch failed - will use direct link fallback (silent, expected behavior)
        }
        
        // Fallback to direct link (signed URLs work directly)
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
        return true;
      };

      // Download ZIP
      await downloadFile(
        data.downloadUrl,
        `${data.trackTitle || 'music-track'}.zip`
      );

      // Download PDF after a short delay
      setTimeout(async () => {
        await downloadFile(
          data.pdfUrl,
          `${data.trackTitle || 'rights'}_rights.pdf`
        );
      }, 800);
    } catch {
      // Silent error - downloads will still work via fallback
      console.warn('Download initiated (using direct links)');
    }
  };

  const handleManualDownload = async (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center paymentSuccessContainer">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!downloadData) {
    return (
      <div className="min-h-screen flex items-center justify-center paymentSuccessContainer">
        <div className="text-center text-white">
          <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Payment Verification Failed</h1>
          <p className="text-gray-400 mb-6">We couldn&apos;t verify your payment. Please contact support.</p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 paymentSuccessContainer">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-green-500/20 rounded-full p-3 mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Payment Successful!
              </h1>
              
              <p className="text-gray-400 text-lg">
                Thank you for your purchase
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-4 text-white mb-4">
                <Download className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Your Downloads</h2>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleManualDownload(downloadData.downloadUrl, `${downloadData.trackTitle}.zip`)}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-lg transition duration-300 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Download Music Files
                </button>
                
                <button
                  onClick={() => handleManualDownload(downloadData.pdfUrl, `${downloadData.trackTitle}_rights.pdf`)}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 px-6 rounded-lg transition duration-300 font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Download Rights PDF
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {downloadData.expiresAt && <p>Downloads expire on: {new Date(downloadData.expiresAt).toLocaleDateString()}</p>}
              <p className="mt-2">You can also download from your profile anytime!</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/dashboard"
              className="inline-block text-white hover:text-gray-300 transition underline"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center paymentSuccessContainer">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
