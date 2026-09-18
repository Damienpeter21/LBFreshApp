// src/modules/products/services/cartService.ts
import { callOdooRpc, ODOO_CONFIG } from '../../../app/config';

export interface CreateSaleOrderPayload {
  partnerId: number;
  partnerShippingId?: number;
  partnerInvoiceId?: number;
  items: Array<{
    productId: number;
    quantity: number;
    priceUnit?: number;
  }>;
}

import { PaymentService, CreatePaymentPayload, RetryPaymentPayload, RefundPaymentPayload } from './paymentService';

export class CartService {
  // ── Cart Operations ──────────────────────────────────────────────────

  /**
   * Fetches all active draft/sent carts for user.
   * Postman: "All my carts" (Cart item 1)
   */
  static async fetchAllCarts(partnerId?: number): Promise<any> {
    const domain: any[] = [['state', 'in', ['draft', 'sent']]];
    if (partnerId) {
      domain.push(['partner_id', '=', Number(partnerId)]);
    }

    return callOdooRpc(
      'sale.order',
      'search_read',
      [domain],
      {
        fields: [
          'id',
          'name',
          'partner_id',
          'date_order',
          'amount_untaxed',
          'amount_tax',
          'amount_total',
          'order_line',
        ],
        order: 'date_order desc',
      },
    );
  }

  /**
   * Fetches specific cart order details and line items.
   * Postman: "To Fetch Cart product details:" (Cart item 2) & "GET Cart" (Cart item 4)
   */
  static async fetchCartDetails(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'search_read',
      [[['id', '=', Number(orderId)], ['state', '=', 'draft']]],
      {
        fields: [
          'id',
          'name',
          'partner_id',
          'amount_untaxed',
          'amount_tax',
          'amount_total',
          'order_line',
        ],
      },
    );
  }

  /**
   * Adds an item to a sale order cart.
   * Postman: "Post Add to Cart" (Cart item 3)
   */
  static async addCartItem(
    orderId: number | string,
    productId: number | string,
    quantity: number,
  ): Promise<any> {
    return callOdooRpc(
      'sale.order.line',
      'create',
      [
        {
          order_id: Number(orderId),
          product_id: Number(productId),
          product_uom_qty: quantity,
        },
      ],
    );
  }

  /**
   * Updates cart item quantity.
   * Postman: "PUT Update Cart Item" (Cart item 5)
   */
  static async updateCartItem(
    lineId: number | string,
    quantity: number,
  ): Promise<any> {
    return callOdooRpc(
      'sale.order.line',
      'write',
      [
        [Number(lineId)],
        {
          product_uom_qty: quantity,
        },
      ],
    );
  }

  /**
   * Removes an item line from cart.
   * Postman: "DELETE Remove Cart Item" (Cart item 6)
   */
  static async removeCartItem(lineId: number | string): Promise<any> {
    return callOdooRpc('sale.order.line', 'unlink', [[Number(lineId)]]);
  }

  /**
   * Clears/deletes the entire cart order.
   * Postman: "DELETE Clear Cart" (Cart item 7)
   */
  static async clearCart(orderId: number | string): Promise<any> {
    return callOdooRpc('sale.order', 'unlink', [[Number(orderId)]]);
  }

  /**
   * Fetches detailed line item records for cart lines.
   */
  static async fetchCartLines(lineIds: (number | string)[]): Promise<any> {
    if (!lineIds || lineIds.length === 0) return { result: [] };
    const numericIds = lineIds.map(id => Number(id));
    return callOdooRpc(
      'sale.order.line',
      'read',
      [numericIds],
      {
        fields: [
          'id',
          'order_id',
          'product_id',
          'product_uom_qty',
          'price_unit',
          'price_subtotal',
          'name',
        ],
      },
    );
  }

  /**
   * Delivery confirmed tracking.
   * Postman: "Delivery confirmed" (Cart item 8)
   */
  static async getDeliveryConfirmed(pickingId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['id', '=', Number(pickingId)], ['state', 'in', ['draft', 'waiting']]]],
      {
        fields: ['id', 'name', 'partner_id', 'origin', 'state', 'scheduled_date'],
        order: 'id desc',
      },
    );
  }

  /**
   * Delivery packed tracking.
   * Postman: "Delivery packed" (Cart item 9)
   */
  static async getDeliveryPacked(pickingId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['id', '=', Number(pickingId)], ['state', 'in', ['confirmed']]]],
      {
        fields: ['id', 'name', 'partner_id', 'origin', 'state', 'scheduled_date'],
        order: 'id desc',
      },
    );
  }

  /**
   * Out for delivery tracking.
   * Postman: "Our For delivery" (Cart item 10)
   */
  static async getDeliveryAssigned(pickingId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['id', '=', Number(pickingId)], ['state', 'in', ['assigned']]]],
      {
        fields: ['id', 'name', 'partner_id', 'origin', 'state', 'scheduled_date'],
        order: 'id desc',
      },
    );
  }

  /**
   * Delivery completed tracking.
   * Postman: "Our For delivery Copy" (Cart item 11)
   */
  static async getDeliveryDone(pickingId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['id', '=', Number(pickingId)], ['state', 'in', ['done']]]],
      {
        fields: ['id', 'name', 'partner_id', 'origin', 'state', 'scheduled_date'],
        order: 'id desc',
      },
    );
  }

  // ── Checkout & Sale Order Creation ───────────────────────────────────

  /**
   * Creates a new Sale Order with order lines.
   * Postman: "Create Sale Order" (sale item 3)
   */
  static async createSaleOrder(payload: CreateSaleOrderPayload): Promise<any> {
    const partnerId = payload.partnerId || ODOO_CONFIG.UID;
    const shippingId = payload.partnerShippingId || partnerId;
    const invoiceId = payload.partnerInvoiceId || partnerId;

    const orderLines = payload.items.map(item => [
      0,
      0,
      {
        product_id: Number(item.productId),
        product_uom_qty: Number(item.quantity),
        ...(item.priceUnit !== undefined ? { price_unit: Number(item.priceUnit) } : {}),
      },
    ]);

    return callOdooRpc(
      'sale.order',
      'create',
      [
        {
          partner_id: partnerId,
          partner_shipping_id: shippingId,
          partner_invoice_id: invoiceId,
          order_line: orderLines,
        },
      ],
    );
  }

  /**
   * Fetches checkout summary for draft order.
   * Postman: "GET Checkout Summary" (Checkout item 1)
   */
  static async getCheckoutSummary(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'search_read',
      [[['id', '=', Number(orderId)], ['state', '=', 'draft']]],
      {
        fields: [
          'id',
          'name',
          'partner_id',
          'partner_shipping_id',
          'partner_invoice_id',
          'order_line',
          'amount_untaxed',
          'amount_tax',
          'amount_total',
          'carrier_id',
          'pricelist_id',
        ],
      },
    );
  }

  /**
   * Validates that checkout prerequisites (shipping address & order lines) are met.
   * Postman: "POST Validate Checkout" (Checkout item 2)
   */
  static async validateCheckout(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'search_read',
      [
        [
          ['id', '=', Number(orderId)],
          ['partner_shipping_id', '!=', false],
          ['order_line', '!=', false],
        ],
      ],
      {
        fields: ['id', 'name', 'state', 'amount_total'],
      },
    );
  }

  /**
   * Fetches available shipping carriers.
   * Postman: "GET Shipping Methods" (Checkout item 3)
   */
  static async getShippingMethods(): Promise<any> {
    return callOdooRpc(
      'delivery.carrier',
      'search_read',
      [[['active', '=', true]]],
      {
        fields: ['id', 'name', 'fixed_price', 'delivery_type', 'free_over'],
      },
    );
  }

  /**
   * Assigns shipping carrier to sale order.
   * Postman: "POST Calculate Shipping" (Checkout item 4)
   */
  static async calculateShipping(
    orderId: number | string,
    carrierId: number | string,
  ): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'write',
      [
        [Number(orderId)],
        {
          carrier_id: Number(carrierId),
        },
      ],
    );
  }

  /**
   * Removes coupon line from sale order.
   * Postman: "DELETE Remove Coupon" (Checkout item 5)
   */
  static async removeCoupon(couponLineId: number | string): Promise<any> {
    return callOdooRpc('sale.order.line', 'unlink', [[Number(couponLineId)]]);
  }

  // ── Payment Operations ───────────────────────────────────────────────

  /**
   * Creates an account payment.
   * Postman: "POST Create Payment" (Payment item 1)
   */
  static async createPayment(payload: CreatePaymentPayload): Promise<any> {
    return PaymentService.createPayment(payload);
  }

  /**
   * Fetches payment details.
   * Postman: "GET Payment Details" (Payment item 2) & "Create Payment" (sale item 14)
   */
  static async getPaymentDetails(paymentId: number | string): Promise<any> {
    return PaymentService.getPaymentDetails(paymentId);
  }

  /**
   * Fetches payment transaction status.
   * Postman: "GET Payment Status" (Payment item 3)
   */
  static async getPaymentStatus(transactionId: number | string): Promise<any> {
    return PaymentService.getPaymentStatus(transactionId);
  }

  /**
   * Confirms / posts payment.
   * Postman: "POST Verify Payment (Post/Confirm)" (Payment item 4)
   */
  static async verifyPayment(paymentId: number | string): Promise<any> {
    return PaymentService.verifyPayment(paymentId);
  }

  /**
   * Retries payment transaction.
   * Postman: "POST Retry Payment" (Payment item 5)
   */
  static async retryPayment(payload: RetryPaymentPayload): Promise<any> {
    return PaymentService.retryPayment(payload);
  }

  /**
   * Initiates payment refund.
   * Postman: "POST Refund Payment" (Payment item 6)
   */
  static async refundPayment(payload: RefundPaymentPayload): Promise<any> {
    return PaymentService.refundPayment(payload);
  }
}
