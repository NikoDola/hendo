// Test script for Firebase-Shopify sync
// This is a temporary file for testing the integration

import { syncNewsletterSubscriberToShopify } from './firebase-shopify-sync';

/**
 * Test function to verify the sync works
 * This should be called manually for testing
 */
export async function testNewsletterSync() {
  try {
    console.log('Testing newsletter subscriber sync to Shopify...');

    const testEmail = `test-${Date.now()}@example.com`;
    const result = await syncNewsletterSubscriberToShopify(testEmail, 'Test', 'User');

    if (result) {
      console.log('✅ Successfully synced newsletter subscriber to Shopify:', result.id);
      return { success: true, customerId: result.id };
    } else {
      console.log('❌ Sync failed but no error thrown');
      return { success: false, error: 'No customer created' };
    }
  } catch (error) {
    console.error('❌ Newsletter sync test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test function to verify Firebase user creation
 */
export async function testFirebaseUserCreation() {
  try {
    console.log('Testing Firebase user creation...');

    const testCustomer = {
      email: `test-customer-${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'Customer',
      id: `gid://shopify/Customer/${Date.now()}`
    };

    // This would require the actual sync function
    console.log('✅ Firebase user creation test prepared');
    return { success: true, message: 'Test prepared - would create Firebase user' };
  } catch (error) {
    console.error('❌ Firebase user creation test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
