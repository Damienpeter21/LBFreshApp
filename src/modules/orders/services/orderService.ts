// src/modules/orders/services/orderService.ts
import { callOdooRpc } from '../../../app/config';

export class OrderService {
  /**
   * Fetches all sale orders for current user/partner.
   * Postman: "Get All My Sale Orders" (sale item 1) & "GET Customer Order History" (Customer item 7)
   */
  static async getAllOrders(
    partnerId?: number | string,
    limit = 100,
    offset = 0,
  ): Promise<any> {
    if (!partnerId) {
      return { result: [] };
    }
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      return { result: [] };
    }

    const domain: any[] = [
      '&',
      '|',
      ['partner_id', '=', pid],
      ['partner_id.parent_id', '=', pid],
      ['state', 'in', ['sale', 'done', 'cancel']],
    ];

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
          'amount_delivery',
          'state',
          'invoice_status',
          'delivery_status',
          'order_line',
          'client_order_ref',
          'transaction_ids',
        ],
        order: 'id desc',
        limit,
        offset,
      },
    );
  }

  /**
   * Fetches active (in-transit / processing) sale orders.
   * Postman: "Active Sale Orders" (sale item 5)
   */
  static async getActiveOrders(partnerId?: number | string): Promise<any> {
    if (!partnerId) {
      return { result: [] };
    }
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      return { result: [] };
    }

    const domain: any[] = [
      '&',
      '|',
      ['partner_id', '=', pid],
      ['partner_id.parent_id', '=', pid],
      '&',
      ['state', '=', 'sale'],
      ['delivery_status', '!=', 'full'],
    ];

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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
          'client_order_ref',
          'transaction_ids',
        ],
        order: 'date_order desc',
      },
    );
  }

  /**
   * Fetches delivered sale orders.
   * Postman: "Active Sale Orders deliverd" (sale item 6)
   */
  static async getDeliveredOrders(partnerId?: number | string): Promise<any> {
    if (!partnerId) {
      return { result: [] };
    }
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      return { result: [] };
    }

    const domain: any[] = [
      '&',
      '|',
      ['partner_id', '=', pid],
      ['partner_id.parent_id', '=', pid],
      '&',
      ['state', '=', 'sale'],
      ['delivery_status', '=', 'full'],
    ];

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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
          'client_order_ref',
          'transaction_ids',
        ],
        order: 'date_order desc',
      },
    );
  }

  /**
   * Fetches cancelled sale orders.
   * Postman: "Cancelled sale order" (sale item 7)
   */
  static async getCancelledOrders(partnerId?: number | string): Promise<any> {
    if (!partnerId) {
      return { result: [] };
    }
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      return { result: [] };
    }

    const domain: any[] = [
      '&',
      '|',
      ['partner_id', '=', pid],
      ['partner_id.parent_id', '=', pid],
      ['state', '=', 'cancel'],
    ];

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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
          'client_order_ref',
          'transaction_ids',
        ],
        order: 'date_order desc',
      },
    );
  }

  /**
   * Fetches single sale order with line IDs and pickings.
   * Postman: "Get Particular Sale Order" (sale item 2)
   */
  static async getOrderDetails(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'read',
      [[Number(orderId)]],
      {
        fields: [
          'id',
          'name',
          'partner_id',
          'date_order',
          'state',
          'amount_untaxed',
          'amount_tax',
          'amount_total',
          'amount_delivery',
          'invoice_status',
          'delivery_status',
          'order_line',
          'picking_ids',
          'invoice_ids',
          'client_order_ref',
          'transaction_ids',
        ],
      },
    );
  }

  /**
   * Fetches sale order line records for specific line IDs.
   */
  static async getOrderLines(lineIds: (number | string)[]): Promise<any> {
    const numericIds = lineIds
      .map(id => Number(id))
      .filter(id => !isNaN(id) && id > 0);

    if (numericIds.length === 0) {
      return [];
    }

    return callOdooRpc(
      'sale.order.line',
      'read',
      [numericIds],
      {
        fields: [
          'id',
          'order_id',
          'product_id',
          'name',
          'product_uom_qty',
          'price_unit',
          'price_subtotal',
          'price_total',
          'discount',
          'product_uom',
        ],
      },
    );
  }

  /**
   * Fetches product thumbnails and UoM from product.product.
   */
  static async getOrderProductThumbnails(productIds: (number | string)[]): Promise<any> {
    const numericIds = Array.from(
      new Set(
        productIds
          .map(id => Number(id))
          .filter(id => !isNaN(id) && id > 0),
      ),
    );

    if (numericIds.length === 0) {
      return [];
    }

    return callOdooRpc(
      'product.product',
      'read',
      [numericIds],
      {
        fields: ['id', 'name', 'image_512', 'image_256', 'image_128', 'product_tmpl_id', 'uom_id'],
      },
    );
  }

  /**
   * Fetches status fields for a sale order.
   * Postman: "Sale Order Status" (sale item 8)
   */
  static async getOrderStatus(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'read',
      [[Number(orderId)]],
      {
        fields: ['id', 'name', 'state', 'delivery_status', 'invoice_status'],
      },
    );
  }

  /**
   * Cancels a sale order.
   * Postman: "Cancel Sale Order" (sale item 4)
   * Calls Odoo RPC execute_kw 'sale.order' 'action_cancel' with [[orderId]].
   */
  static async cancelOrder(orderId: number | string, reason?: string): Promise<any> {
    const numId = Number(orderId);
    if (__DEV__ && reason) {
      console.log(`[OrderService] Cancelling order ${numId} with reason: "${reason}"`);
    }
    try {
      const res = await callOdooRpc('sale.order', 'action_cancel', [[numId]]);
      if (res?.result && typeof res.result === 'object' && res.result.res_model === 'sale.order.cancel') {
        await callOdooRpc('sale.order', 'write', [[numId], { state: 'cancel' }]);
      }
      return res;
    } catch (err) {
      return callOdooRpc('sale.order', 'write', [[numId], { state: 'cancel' }]);
    }
  }

  // ── Delivery Tracking APIs (stock.picking) ───────────────────────────

  /**
   * Fetches delivery tracking details for a specific sale order.
   * Postman: "Delivery Tracking particular sale" (sale item 9)
   */
  static async getDeliveryTracking(saleId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['sale_id', '=', Number(saleId)]]],
      {
        fields: [
          'id',
          'name',
          'origin',
          'state',
          'scheduled_date',
          'date_done',
          'carrier_id',
          'partner_id',
        ],
        order: 'scheduled_date desc',
      },
    );
  }

  /**
   * Fetches all outgoing delivery stock pickings.
   * Postman: "Delivery Tracking All Delivery" (sale item 10)
   */
  static async getAllDeliveryTrackings(): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['picking_type_id.code', '=', 'outgoing']]],
      {
        fields: [
          'id',
          'name',
          'origin',
          'sale_id',
          'partner_id',
          'state',
          'scheduled_date',
          'date_done',
          'carrier_id',
        ],
        order: 'id desc',
      },
    );
  }

  /**
   * Fetches active (in-transit/not done) outgoing deliveries.
   * Postman: "Delivery Tracking Active" (sale item 11)
   */
  static async getActiveDeliveryTrackings(): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [
        [
          ['picking_type_id.code', '=', 'outgoing'],
          ['state', 'not in', ['done', 'cancel']],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'origin',
          'sale_id',
          'partner_id',
          'state',
          'scheduled_date',
          'carrier_id',
        ],
        order: 'scheduled_date desc',
      },
    );
  }

  /**
   * Fetches delivered outgoing deliveries.
   * Postman: "Delivery Tracking Deliverd" (sale item 12)
   */
  static async getDeliveredTrackings(): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [
        [
          ['picking_type_id.code', '=', 'outgoing'],
          ['state', '=', 'done'],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'origin',
          'sale_id',
          'partner_id',
          'state',
          'scheduled_date',
          'date_done',
          'carrier_id',
        ],
        order: 'date_done desc',
      },
    );
  }

  /**
   * Fetches cancelled outgoing deliveries.
   * Postman: "Delivery Tracking Canceled" (sale item 13)
   */
  static async getCancelledTrackings(): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [
        [
          ['picking_type_id.code', '=', 'outgoing'],
          ['state', '=', 'cancel'],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'origin',
          'sale_id',
          'partner_id',
          'state',
          'scheduled_date',
          'date_done',
          'carrier_id',
        ],
        order: 'scheduled_date desc',
      },
    );
  }

  // ── Invoice & Payment APIs (account.move) ────────────────────────────

  /**
   * Fetches invoices associated with a sale order origin.
   * Postman: "Sale Order Payment" (sale item 15)
   */
  static async getOrderInvoices(originName: string): Promise<any> {
    const cleanOrigin = originName ? originName.replace(/^#/, '').trim() : '';
    return callOdooRpc(
      'account.move',
      'search_read',
      [
        [
          ['invoice_origin', '=', cleanOrigin],
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

  // ── Order Confirmation & Delivery Picking (sale.order & stock.picking) ────

  /**
   * Confirms sale order and automatically generates stock.picking delivery order.
   * Postman: "Confirm Sale order" (sale item)
   */
  static async confirmSaleOrder(orderId: number | string): Promise<any> {
    return callOdooRpc(
      'sale.order',
      'action_confirm',
      [[Number(orderId)]],
    );
  }

  /**
   * Fetches stock.picking delivery order details against a sale order ID.
   * Postman: "Get Delivery details" (sale item)
   */
  static async getDeliveryDetails(saleId: number | string): Promise<any> {
    return callOdooRpc(
      'stock.picking',
      'search_read',
      [[['sale_id', '=', Number(saleId)]]],
      {
        fields: ['id', 'name', 'state'],
      },
    );
  }
}
