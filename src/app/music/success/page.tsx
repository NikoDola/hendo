'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, FileText, X } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [downloadData, setDownloadData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter();

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
        if (data.error) {
          console.error('Payment verification error:', data.error);
          alert(`Error: ${data.error}`);
          return;
        }
        setDownloadData(data);
        // Show popup and try to auto-download
        setShowPopup(true);
        // Try auto-download after a short delay (browser may block it)
        setTimeout(() => {
          startDownloads(data);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment verification failed:', errorData);
        alert(`Failed to verify payment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Failed to verify payment. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const startDownloads = async (data: any) => {
    if (!data.downloadUrl || !data.pdfUrl) return;
    
    try {
      // Download ZIP file - try fetch first, fallback to direct link
      const downloadFile = async (url: string, filename: string, isPdf: boolean = false) => {
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
        } catch (fetchError) {
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
        `${data.trackTitle || 'music-track'}.zip`,
        false
      );

      // Download PDF after a short delay
      setTimeout(async () => {
        await downloadFile(
          data.pdfUrl,
          `${data.trackTitle || 'rights'}_rights.pdf`,
          true
        );
      }, 800);

      setDownloaded(true);
    } catch (error) {
      // Silent error - downloads will still work via fallback
      console.warn('Download initiated (using direct links)');
    }
  };

  const handleDownloadAll = () => {
    if (!downloadData) return;
    startDownloads(downloadData);
  };

  const handleManualDownload = async (url: string, filename: string) => {
    try {
      // Use fetch to download the file and create a blob URL to avoid redirects
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      if (!downloaded) {
        setDownloaded(true);
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: direct link (signed URLs should work directly)
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
      
      if (!downloaded) {
        setDownloaded(true);
        setShowPopup(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            No session ID found. Please check your email for purchase confirmation.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to My Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Thank You Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
              Thank you for purchasing!
            </h2>
            <p className="text-gray-600 mb-4 text-center">
              {downloaded 
                ? 'Downloads started! You can also check your profile to download again anytime.'
                : 'Click the button below to download your tracks. You can also download from your profile anytime.'}
            </p>
            <div className="flex flex-col gap-2">
              {!downloaded && downloadData && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  Download Now
                </button>
              )}
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setShowPopup(false)}
              >
                View My Profile
              </Link>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <button
                    onClick={() => handleManualDownload(downloadData.downloadUrl, `${downloadData.trackTitle || 'music-track'}.zip`)}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download size={20} />
                    Download Music Track
                  </button>
                  <button
                    onClick={() => handleManualDownload(downloadData.pdfUrl, `${downloadData.trackTitle || 'rights'}_rights.pdf`)}
                    className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <FileText size={20} />
                    Download Rights PDF
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Downloads expire on: {new Date(downloadData.expiresAt).toLocaleDateString()}</p>
                <p className="mt-2">You can also download from your profile anytime!</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 space-y-2">
            <Link
              href="/dashboard"
              className="block text-blue-600 hover:text-blue-800 font-medium"
            >
              View My Profile
            </Link>
            <Link
              href="/music"
              className="block text-gray-600 hover:text-gray-800 text-sm"
            >
              Browse More Music
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
