'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Frown, Home, Music, ShoppingBag } from 'lucide-react';
import '@/components/pages/PaymentCancel.css';

export default function PaymentCancel() {
  useEffect(() => {
    // Replace history entry so Back doesn't bounce into Stripe URLs
    try {
      window.history.replaceState({}, '', '/music/cancel');
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="paymentCancelContainer">
      <div className="paymentCancelCard glass-effect">
        <div className="paymentCancelIcon" aria-hidden="true">
          <Frown size={42} color="#ef4444" />
        </div>

        <h1 className="paymentCancelTitle" data-text="Payment Cancelled">Payment Cancelled</h1>
        <p className="paymentCancelSubtitle">
          No worries — your payment was cancelled and <strong>no charges were made</strong>.
        </p>

        <div className="paymentCancelActions">
          <Link href="/dashboard/cart" className="paymentCancelButton paymentCancelButtonPrimary">
            <ShoppingBag size={20} />
            Return to Cart
          </Link>

          <Link href="/music" className="paymentCancelButton paymentCancelButtonSecondary">
            <Music size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="paymentCancelNote">
          If you keep seeing cancellations, check your card details or try a different payment method.
        </div>
              <div className="paymentCancelLinkRow">
        <Link href="/" className="paymentCancelHomeLink">
          <Home size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Go Home →
        </Link>
      </div>
      </div>


    </div>
  );
}
