/**
 * Razorpay Mobile Checkout Settings
 */

export interface RazorpayConfig {
  /** Razorpay Key ID (rzp_test_... or rzp_live_...) */
  keyId: string;
  /** Merchant display name on checkout bottom sheet */
  merchantName: string;
  /** Checkout description */
  description: string;
  /** Base currency */
  currency: 'INR';
  /** Primary brand header color */
  themeColor: string;
}

export const RAZORPAY_SETTINGS: RazorpayConfig = {
  keyId: 'rzp_test_LBFreshDemoKey2026',
  merchantName: 'LBFresh Basket',
  description: '15-Min Fast Grocery & Essentials Delivery',
  currency: 'INR',
  themeColor: '#063B00',
};

export default RAZORPAY_SETTINGS;
