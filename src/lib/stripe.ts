// Stripe configuration and utilities
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Create a payment intent for music purchase
export async function createPaymentIntent(amount: number, currency: string = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

// Create a checkout session for music purchase
export async function createCheckoutSession(
  musicTrackId: string,
  musicTitle: string,
  price: number,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: musicTitle,
              description: `Music track: ${musicTitle}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        musicTrackId,
        type: 'music_purchase'
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Verify payment and generate download links
export async function verifyPaymentAndGenerateDownload(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Generate download links and PDF
      const downloadData = await generateMusicDownload(paymentIntent.metadata);
      return downloadData;
    }
    
    throw new Error('Payment not completed');
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
}

// Generate music download package
async function generateMusicDownload(metadata: any) {
  // This would generate the actual download package
  // For now, return mock data
  return {
    downloadUrl: `https://example.com/downloads/${metadata.musicTrackId}.zip`,
    pdfUrl: `https://example.com/rights/${metadata.musicTrackId}.pdf`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
}
