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
  static async createPayment(payload: {
    partnerId: number | string;
    amount: number;
    journalId?: number;
    paymentMethodLineId?: number;
  }): Promise<any> {
    return callOdooRpc(
      'account.payment',
      'create',
      [
        {
          payment_type: 'inbound',
          partner_type: 'customer',
          partner_id: Number(payload.partnerId),
          amount: Number(payload.amount),
          journal_id: payload.journalId || 7,
          payment_method_line_id: payload.paymentMethodLineId || 1,
        },
      ],
    );
  }

  /**
   * Fetches payment details.
   * Postman: "GET Payment Details" (Payment item 2) & "Create Payment" (sale item 14)
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

  /**
   * Confirms / posts payment.
   * Postman: "POST Verify Payment (Post/Confirm)" (Payment item 4)
   */
  static async verifyPayment(paymentId: number | string): Promise<any> {
    return callOdooRpc(
      'account.payment',
      'action_post',
      [[Number(paymentId)]],
    );
  }

  /**
   * Retries payment transaction.
   * Postman: "POST Retry Payment" (Payment item 5)
   */
  static async retryPayment(payload: {
    orderId: number | string;
    partnerId: number | string;
    amount: number;
    reference: string;
    currencyId?: number;
    providerId?: number;
  }): Promise<any> {
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

  /**
   * Initiates payment refund.
   * Postman: "POST Refund Payment" (Payment item 6)
   */
  static async refundPayment(payload: {
    partnerId: number | string;
    amount: number;
    journalId?: number;
  }): Promise<any> {
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
}
