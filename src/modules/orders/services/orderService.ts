// src/modules/orders/services/orderService.ts
import { callOdooRpc } from '../../../app/config';

export class OrderService {
  /**
   * Fetches all sale orders for current user/partner.
   * Postman: "Get All My Sale Orders" (sale item 1) & "GET Customer Order History" (Customer item 7)
   */
  static async getAllOrders(
    partnerId?: number | string,
    limit = 50,
    offset = 0,
  ): Promise<any> {
    const domain: any[] = [];
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
          'state',
          'invoice_status',
          'delivery_status',
          'order_line',
        ],
        order: 'date_order desc',
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
    const domain: any[] = [
      ['state', '=', 'sale'],
      ['delivery_status', '!=', 'full'],
    ];
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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
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
    const domain: any[] = [
      ['state', '=', 'sale'],
      ['delivery_status', '=', 'full'],
    ];
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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
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
    const domain: any[] = [['state', '=', 'cancel']];
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
          'amount_total',
          'state',
          'delivery_status',
          'invoice_status',
          'order_line',
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
          'invoice_status',
          'delivery_status',
          'order_line',
          'picking_ids',
          'invoice_ids',
        ],
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
   */
  static async cancelOrder(orderId: number | string): Promise<any> {
    return callOdooRpc('sale.order', 'action_cancel', [[Number(orderId)]]);
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
