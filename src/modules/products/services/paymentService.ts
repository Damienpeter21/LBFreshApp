// src/modules/products/services/paymentService.ts
import { Alert, NativeModules } from 'react-native';
import axios from 'axios';
import { API_SETTINGS, callOdooRpc, RAZORPAY_SETTINGS } from '../../../app/config';

// Defensively resolve RazorpayCheckout to prevent crash if native bridge is not yet linked
let RazorpayCheckout: any = null;
try {
  const RazorpayPackage = require('react-native-razorpay');
  RazorpayCheckout = RazorpayPackage.default || RazorpayPackage;
} catch (err) {
  console.warn('react-native-razorpay could not be imported:', err);
}

/** Safe Base64 encoding compatible across React Native / Hermes / JSC */
const toBase64 = (input: string): string => {
  const globalBtoa = (globalThis as any)?.btoa;
  if (typeof globalBtoa === 'function') {
    return globalBtoa(input);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, idx = 0, map = chars;
    input.charAt(idx | 0) || ((map = '='), idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = input.charCodeAt((idx += 3 / 4));
    if (charCode > 0xff) {
      throw new Error("'btoa' failed: The string contains characters outside Latin1 range.");
    }
    block = (block << 8) | charCode;
  }
  return output;
};

export interface RazorpayCheckoutOptions {
  amount: number; // in Rupees, will be converted to paise
  orderId: string | number;
  name?: string;
  email?: string;
  contact?: string;
  description?: string;
  notes?: Record<string, string>;
  method?: string;
  key?: string;
  secret?: string;
}

export interface RazorpayPaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayPaymentErrorResult {
  code: number | string;
  description: string;
  source?: string;
  step?: string;
  reason?: string;
}

export interface CreatePaymentPayload {
  partnerId: number | string;
  amount: number;
  journalId?: number;
  paymentMethodLineId?: number;
  memo?: string;
}

export interface RetryPaymentPayload {
  orderId: number | string;
  partnerId: number | string;
  amount: number;
  reference: string;
  currencyId?: number;
  providerId?: number;
}

export interface RefundPaymentPayload {
  partnerId: number | string;
  amount: number;
  journalId?: number;
}

export class PaymentService {
  // ── 1. Create Payment (Odoo account.payment create) ──────────────────────
  /**
   * Creates an account payment in Odoo.
   * Postman: "POST Create Payment" (Payment item 1)
   */
  static async createPayment(payload: CreatePaymentPayload): Promise<any> {
    const paymentValues: Record<string, any> = {
      payment_type: 'inbound',
      partner_type: 'customer',
      partner_id: Number(payload.partnerId),
      amount: Number(payload.amount),
      journal_id: payload.journalId || 7,
      payment_method_line_id: payload.paymentMethodLineId || 1,
    };

    if (payload.memo) {
      paymentValues.memo = payload.memo;
    }

    return callOdooRpc('account.payment', 'create', [paymentValues]);
  }

  // ── 2. Get Payment Details (Odoo account.payment search_read) ───────────
  /**
   * Fetches payment details.
   * Postman: "GET Payment Details" (Payment item 2)
   */
  static async getPaymentDetails(paymentId: number | string): Promise<any> {
    return callOdooRpc(
      'account.payment',
      'search_read',
      [[['id', '=', Number(paymentId)]]],
      {
        fields: [
          'id',
          'name',
          'partner_id',
          'amount',
          'payment_type',
          'state',
          'date',
          'journal_id',
          'memo',
          'reconciled_invoice_ids',
        ],
      },
    );
  }

  // ── 3. Get Payment Status (Odoo payment.transaction search_read) ─────────
  /**
   * Fetches payment transaction status.
   * Postman: "GET Payment Status" (Payment item 3)
   */
  static async getPaymentStatus(transactionId: number | string): Promise<any> {
    return callOdooRpc(
      'payment.transaction',
      'search_read',
      [[['id', '=', Number(transactionId)]]],
      {
        fields: [
          'id',
          'reference',
          'amount',
          'currency_id',
          'state',
          'provider_id',
          'provider_reference',
          'sale_order_ids',
        ],
      },
    );
  }

  // ── 4. Verify Payment (Odoo account.payment action_post) ─────────────────
  /**
   * Confirms / posts payment in Odoo.
   * Postman: "POST Verify Payment (Post/Confirm)" (Payment item 4)
   */
  static async verifyPayment(paymentId: number | string): Promise<any> {
    return callOdooRpc(
      'account.payment',
      'action_post',
      [[Number(paymentId)]],
    );
  }

  // ── 5. Retry Payment (Odoo payment.transaction create) ───────────────────
  /**
   * Creates a retry transaction record in Odoo.
   * Postman: "POST Retry Payment" (Payment item 5)
   */
  static async retryPayment(payload: RetryPaymentPayload): Promise<any> {
    return callOdooRpc(
      'payment.transaction',
      'create',
      [
        {
          sale_order_ids: [[4, Number(payload.orderId)]],
          partner_id: Number(payload.partnerId),
          amount: Number(payload.amount),
          currency_id: payload.currencyId || 20,
          provider_id: payload.providerId || 1,
          reference: payload.reference,
        },
      ],
    );
  }

  // ── 6. Refund Payment (Odoo account.payment create outbound) ─────────────
  /**
   * Initiates payment refund in Odoo.
   * Postman: "POST Refund Payment" (Payment item 6)
   */
  static async refundPayment(payload: RefundPaymentPayload): Promise<any> {
    return callOdooRpc(
      'account.payment',
      'create',
      [
        {
          payment_type: 'outbound',
          partner_type: 'customer',
          partner_id: Number(payload.partnerId),
          amount: Number(payload.amount),
          journal_id: payload.journalId || 7,
        },
      ],
    );
  }

  // ── 7. Sale Order Invoices (Odoo account.move search_read) ───────────────
  /**
   * Fetches invoices related to a sale order origin.
   * Postman: "Sale Order Payment" (sale item 15)
   */
  static async getOrderInvoices(originName: string): Promise<any> {
    return callOdooRpc(
      'account.move',
      'search_read',
      [
        [
          ['invoice_origin', '=', originName],
          ['move_type', '=', 'out_invoice'],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'invoice_date',
          'invoice_date_due',
          'amount_untaxed',
          'amount_tax',
          'amount_total',
          'amount_residual',
          'state',
        ],
      },
    );
  }

  // ── 8. Razorpay Checkout & Order Integration ────────────────────────────
  /**
   * Creates an official Razorpay Order via the Razorpay Orders API.
   * Basic Auth: Base64(key:secret)
   * Postman: "Razor pay" (Payment item 8)
   */
  static async createRazorpayOrder(params: {
    amount: number; // in Rupees
    receipt: string;
    key?: string;
    secret?: string;
    notes?: Record<string, string>;
  }): Promise<string | null> {
    const key = params.key || API_SETTINGS.razorPay?.key || RAZORPAY_SETTINGS.keyId;
    const secret = params.secret || API_SETTINGS.razorPay?.secret || RAZORPAY_SETTINGS.keySecret;

    if (!key || !secret) {
      return null;
    }

    try {
      const amountPaise = Math.round(Number(params.amount) * 100);
      const authHeader = `Basic ${toBase64(`${key}:${secret}`)}`;

      const res = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountPaise,
          currency: RAZORPAY_SETTINGS.currency || 'INR',
          receipt: params.receipt.substring(0, 40),
          notes: params.notes || {},
        },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          timeout: 4000,
          skipAuth: true,
        },
      );

      if (res?.data?.id) {
        console.log('Razorpay server order created successfully:', res.data.id);
        return res.data.id;
      }
    } catch (err: any) {
      console.warn('Razorpay order creation note:', err?.response?.data || err?.message || err);
    }
    return null;
  }

  /**
   * Opens Razorpay Mobile Checkout bottomsheet SDK.
   * Uses Razorpay Key ID and Secret configured in API_SETTINGS.razorPay.
   * Postman: "Razor pay" (Payment item 8)
   */
  static async openRazorpayCheckout(
    options: RazorpayCheckoutOptions,
  ): Promise<RazorpayPaymentSuccessResult> {
    const amountInPaise = Math.round(Number(options.amount) * 100);
    const key = options.key || API_SETTINGS.razorPay?.key || RAZORPAY_SETTINGS.keyId;
    const secret = options.secret || API_SETTINGS.razorPay?.secret || RAZORPAY_SETTINGS.keySecret;

    // 1. Defensively attempt to generate an official Razorpay server order
    let razorpayOrderId: string | null = null;
    if (key && secret) {
      try {
        razorpayOrderId = await PaymentService.createRazorpayOrder({
          amount: options.amount,
          receipt: `rcpt_${options.orderId}`,
          key,
          secret,
          notes: {
            app_order_id: String(options.orderId),
            ...(options.notes || {}),
          },
        });
      } catch (err) {
        console.warn('Could not pre-create Razorpay order, proceeding with direct checkout:', err);
      }
    }

    // 2. Sanitize and include prefill fields.
    // NOTE: Do not inject `method` into prefill, as Razorpay Android SDK will attempt
    // to directly invoke an external intent rather than opening the checkout sheet.
    const prefill: Record<string, string> = {
      name: (options.name && options.name.trim()) || 'Customer',
    };
    if (options.email && options.email.trim() && options.email.includes('@')) {
      prefill.email = options.email.trim();
    }
    if (options.contact && options.contact.trim()) {
      const cleanDigits = options.contact.replace(/\D/g, '');
      if (cleanDigits.length >= 10) {
        prefill.contact = cleanDigits.slice(-10);
      }
    }

    // 3. Build checkout configuration
    // Passing amount as a String prevents floating point / double-casting errors on Android
    const checkoutConfig: any = {
      key,
      key_id: key,
      amount: String(amountInPaise),
      currency: RAZORPAY_SETTINGS.currency || 'INR',
      name: RAZORPAY_SETTINGS.merchantName || 'LB Fresh Basket',
      description: options.description || RAZORPAY_SETTINGS.description || 'Groceries & Essentials',
      theme: {
        color: RAZORPAY_SETTINGS.themeColor || '#063B00',
      },
      prefill,
      notes: {
        order_id: String(options.orderId),
        payment_method: options.method || 'upi',
        ...(options.notes || {}),
      },
    };

    if (razorpayOrderId) {
      checkoutConfig.order_id = razorpayOrderId;
    }

    // Call native Razorpay SDK with safe exception boundary
    return new Promise<RazorpayPaymentSuccessResult>((resolve, reject) => {
      if (RazorpayCheckout == null || typeof RazorpayCheckout.open !== 'function') {
        Alert.alert(
          'Razorpay Test Mode',
          `Merchant: ${RAZORPAY_SETTINGS.merchantName}\nAmount: ₹${options.amount}\nKey: ${key}\n${razorpayOrderId ? `Order: ${razorpayOrderId}\n` : ''}\n(Razorpay native module not found. Simulate test success?)`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                reject({
                  code: 0,
                  description: 'Payment cancelled by user',
                } as RazorpayPaymentErrorResult);
              },
            },
            {
              text: 'Simulate Success',
              onPress: () => {
                resolve({
                  razorpay_payment_id: `pay_test_${Date.now()}`,
                  razorpay_order_id: razorpayOrderId || `order_test_${options.orderId}`,
                  razorpay_signature: `sig_test_${Date.now()}`,
                });
              },
            },
          ],
          { cancelable: false },
        );
        return;
      }

      try {
        RazorpayCheckout.open(checkoutConfig)
          .then((data: RazorpayPaymentSuccessResult) => {
            console.log('Razorpay checkout success:', data);
            resolve(data);
          })
          .catch((error: RazorpayPaymentErrorResult) => {
            console.warn('Razorpay checkout returned error:', error);
            reject(error);
          });
      } catch (nativeErr: any) {
        console.warn('Native RazorpayCheckout.open caught error:', nativeErr);
        reject({
          code: 2,
          description: nativeErr?.message || 'Native Razorpay module could not be opened',
        });
      }
    });
  }
}

export default PaymentService;
