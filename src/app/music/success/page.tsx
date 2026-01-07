'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import '@/components/pages/PaymentSuccess.css';

function PaymentSuccessContent() {
  const [downloadData, setDownloadData] = useState<{
    downloadUrl?: string;
    pdfUrl?: string;
    trackTitle?: string;
    expiresAt?: string;
    purchasedTrackIds?: string[];
    items?: Array<{
      trackId: string;
      trackTitle: string;
      downloadUrl: string;
      pdfUrl: string;
      expiresAt: string;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { removeFromCart } = useCart();

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId);
      
      // Add a timeout fallback (30 seconds)
      const timeout = setTimeout(() => {
        console.warn('⚠️ Payment verification timed out');
        setIsLoading(false);
      }, 30000);
      
      return () => clearTimeout(timeout);
    } else {
      console.error('❌ No session ID found in URL');
      setIsLoading(false);
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Payment verification failed:', errorData);
        throw new Error(errorData.error || 'Failed to verify payment');
      }

      const data = await response.json();
      
      if ((data.downloadUrl && data.pdfUrl) || (Array.isArray(data.items) && data.items.length > 0)) {
        setDownloadData(data);
        setIsLoading(false);

        // Remove purchased items from cart (safe even if they're not in the cart)
        const purchasedIds: string[] = Array.isArray(data.purchasedTrackIds)
          ? data.purchasedTrackIds
          : (data.trackId ? [data.trackId] : []);
        purchasedIds.forEach((id) => removeFromCart(id));
        
        // Auto-start download after a short delay
        setTimeout(() => {
          startDownloads(data);
        }, 500);
      } else {
        console.error('❌ Invalid download data:', data);
        throw new Error('Invalid download data received');
      }
    } catch (error) {
      console.error('💥 Payment verification error:', error);
      setIsLoading(false);
    }
  };

  const startDownloads = async (data: {
    downloadUrl?: string;
    pdfUrl?: string;
    trackTitle?: string;
    items?: Array<{ trackTitle: string; downloadUrl: string; pdfUrl: string }>;
  }) => {
    
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

      const items = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : (data.downloadUrl && data.pdfUrl
          ? [{ trackTitle: data.trackTitle || 'music-track', downloadUrl: data.downloadUrl, pdfUrl: data.pdfUrl }]
          : []);

      for (const item of items) {
        await downloadFile(item.downloadUrl, `${item.trackTitle || 'music-track'}.zip`);
        // Small delay between downloads to reduce browser blocking
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 400));
        await downloadFile(item.pdfUrl, `${item.trackTitle || 'rights'}_rights.pdf`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 500));
      }
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
      <div className="paymentSuccessContainer">
        <div className="paymentSuccessLoading">
          <div className="paymentSuccessSpinner"></div>
          <p className="paymentSuccessLoadingText">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!downloadData) {
    return (
      <div className="paymentSuccessContainer">
        <div className="paymentSuccessCard glass-effect">
          <div className="paymentSuccessError">
            <X className="paymentSuccessErrorIcon" />
            <h1 className="paymentSuccessErrorTitle">Payment Verification Failed</h1>
            <p className="paymentSuccessErrorMessage">We couldn&apos;t verify your payment. Please contact support.</p>
            <Link href="/" className="paymentSuccessErrorButton">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paymentSuccessContainer">
      <div className="paymentSuccessCard glass-effect">
        <div className="paymentSuccessIcon">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="paymentSuccessTitle">
          Payment Successful!
        </h1>
        
        <p className="paymentSuccessSubtitle">
          Thank you for your purchase
        </p>

        <div className="paymentDownloadsSection">
          <div className="paymentDownloadsHeader">
            <Download className="w-6 h-6" />
            <h2>Your Downloads</h2>
          </div>
          
          {Array.isArray(downloadData.items) && downloadData.items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {downloadData.items.map((item) => (
                <div key={item.trackId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{item.trackTitle}</div>
                  <button
                    onClick={() => handleManualDownload(item.downloadUrl, `${item.trackTitle}.zip`)}
                    className="paymentDownloadButton paymentDownloadButtonZip"
                  >
                    <Download className="w-5 h-5" />
                    Download Music Package
                  </button>
                  <button
                    onClick={() => handleManualDownload(item.pdfUrl, `${item.trackTitle}_rights.pdf`)}
                    className="paymentDownloadButton paymentDownloadButtonPdf"
                  >
                    <FileText className="w-5 h-5" />
                    Download Rights PDF
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => handleManualDownload(downloadData.downloadUrl!, `${downloadData.trackTitle}.zip`)}
                className="paymentDownloadButton paymentDownloadButtonZip"
              >
                <Download className="w-5 h-5" />
                Download Music Package
              </button>
              
              <button
                onClick={() => handleManualDownload(downloadData.pdfUrl!, `${downloadData.trackTitle}_rights.pdf`)}
                className="paymentDownloadButton paymentDownloadButtonPdf"
              >
                <FileText className="w-5 h-5" />
                Download Rights PDF
              </button>
            </>
          )}
        </div>
        
        <div className="paymentSuccessNote">
          <p>You can also download your purchases from your dashboard anytime!</p>
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <Link href="/dashboard" className="paymentSuccessDashboardLink">
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="paymentSuccessContainer">
        <div className="paymentSuccessLoading">
          <div className="paymentSuccessSpinner"></div>
          <p className="paymentSuccessLoadingText">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
