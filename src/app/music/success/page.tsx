'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import '@/components/pages/PaymentSuccess.css';

function PaymentSuccessContent() {
  const [downloadData, setDownloadData] = useState<{
    collectionZipUrl?: string;
    expiresAt?: string;
    purchasedTrackIds?: string[];
    items?: Array<{
      trackId: string;
      trackTitle: string;
      price: number;
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
      // If we already verified in this tab, allow the success page to show without re-verifying.
      try {
        const cached = typeof window !== 'undefined'
          ? window.sessionStorage.getItem('hendo_last_purchase')
          : null;
        if (cached) {
          const parsed = JSON.parse(cached) as unknown;
          setDownloadData(parsed as typeof downloadData);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
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
      
      if (data.collectionZipUrl) {
        setDownloadData(data);
        setIsLoading(false);

        // Remove purchased items from cart (safe even if they're not in the cart)
        const purchasedIds: string[] = Array.isArray(data.purchasedTrackIds)
          ? data.purchasedTrackIds
          : [];
        purchasedIds.forEach((id) => removeFromCart(id));

        // Clear any cart backup after a successful purchase
        try {
          window.sessionStorage.removeItem('hendo_cart_backup');
        } catch {
          // ignore
        }

        // Store the verified purchase data for this tab so Back/Forward doesn't re-trigger verification
        try {
          window.sessionStorage.setItem('hendo_last_purchase', JSON.stringify(data));
          // Remove the session_id param from history to avoid confusing back navigation
          window.history.replaceState({}, '', '/music/success');
        } catch {
          // ignore
        }
        
        // Auto-start ZIP download after a short delay (no PDFs)
        setTimeout(() => {
          if (data.collectionZipUrl) {
            startDownloads(data.collectionZipUrl);
          }
        }, 500);
      } else {
        console.error('❌ Invalid download data:', data);
        throw new Error('Invalid download data received');
      }
    } catch (error) {
      console.error('💥 Payment verification error:', error);
      setIsLoading(false);
    } finally {
      // Always remove the session_id param after an attempt to prevent confusing Back navigation loops.
      try {
        window.history.replaceState({}, '', '/music/success');
      } catch {
        // ignore
      }
    }
  };

  const startDownloads = async (zipUrl: string) => {
    try {
      // Try fetch -> blob download first, fallback to direct link.
      const filename = 'Hendo-Beats-Collection.zip';
      try {
        const response = await fetch(zipUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
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
            if (document.body.contains(link)) document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
          return;
        }
      } catch {
        // ignore and fallback
      }

      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 100);
    } catch {
      console.warn('Download initiated (using direct links)');
    }
  };

  const handleManualDownload = async (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
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
            <p className="paymentSuccessErrorMessage">
              We couldn&apos;t verify your payment. If you completed checkout, please contact support.
            </p>
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

          {Array.isArray(downloadData.items) && downloadData.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>Included Tracks:</div>
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
                {downloadData.items.map((item) => (
                  <li key={item.trackId} style={{ marginBottom: 4 }}>
                    {item.trackTitle}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => handleManualDownload(downloadData.collectionZipUrl!, 'Hendo-Beats-Collection.zip')}
            className="paymentDownloadButton paymentDownloadButtonZip"
          >
            <Download className="w-5 h-5" />
            Download Hendo-Beats-Collection.zip
          </button>
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
