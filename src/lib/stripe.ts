// Stripe configuration and utilities
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

export interface CheckoutItem {
  id: string;
  title: string;
  price: number;
}

// Server-side Stripe instance
const stripeSecretKey = process.env.STRIPE_TEST_KEY;
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables. Please add it to your .env.local file.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    })
  : null as unknown as Stripe; // Will throw error if used without key

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY!);
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
  customerEmail: string | undefined,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env.local file.');
  }
  
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
      ...(customerEmail ? { customer_email: customerEmail } : {}),
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

// Create a checkout session for multiple music purchases (cart)
export async function createCheckoutSessionForItems(
  items: CheckoutItem[],
  customerEmail: string | undefined,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env.local file.');
  }

  const cleaned = items
    .filter(i => i && typeof i.id === 'string' && typeof i.title === 'string' && typeof i.price === 'number')
    .filter(i => i.id.trim().length > 0 && i.title.trim().length > 0 && Number.isFinite(i.price) && i.price > 0);

  if (cleaned.length === 0) {
    throw new Error('No valid items provided for checkout');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cleaned.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: `Music track: ${item.title}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: {
        musicTrackIds: JSON.stringify(cleaned.map(i => i.id)),
        type: 'music_cart_purchase'
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating cart checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Verify payment and generate download links
export async function verifyPaymentAndGenerateDownload(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Generate download links and PDF
      const downloadData = await generateMusicDownload(paymentIntent.metadata as unknown as { musicTrackId: string; musicTitle: string; userId: string });
      return downloadData;
    }
    
    throw new Error('Payment not completed');
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
}

// Generate music download package
async function generateMusicDownload(metadata: { musicTrackId: string; musicTitle: string; userId: string }) {
  // This would generate the actual download package
  // For now, return mock data
  return {
    downloadUrl: `https://example.com/downloads/${metadata.musicTrackId}.zip`,
    pdfUrl: `https://example.com/rights/${metadata.musicTrackId}.pdf`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
}
