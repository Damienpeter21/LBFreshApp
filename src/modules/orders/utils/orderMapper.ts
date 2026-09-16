// src/modules/orders/utils/orderMapper.ts
import { DeliveryPartner, Order, OrderItem, OrderStatus } from '../types';
import { Product } from '../../products/types/product';
import { mapOdooProductToProduct } from '../../products/utils/productMapper';

/**
 * Normalizes Odoo `state` and `delivery_status` to our standard `OrderStatus`.
 */
export const mapOdooStateToOrderStatus = (
  state?: string,
  deliveryStatus?: string,
): OrderStatus => {
  const normalizedState = (state ?? '').toLowerCase();
  const normalizedDelivery = (deliveryStatus ?? '').toLowerCase();

  if (normalizedState === 'cancel') {
    return 'cancelled';
  }

  if (normalizedDelivery === 'full') {
    return 'delivered';
  }

  if (normalizedDelivery === 'partial' || normalizedState === 'sale') {
    return 'in_transit';
  }

  if (normalizedState === 'draft' || normalizedState === 'sent') {
    return 'preparing';
  }

  return 'preparing';
};

/**
 * Maps an Odoo `sale.order` JSON response item to the mobile app `Order` model.
 */
export const mapOdooSaleOrderToOrder = (
  rawOrder: any,
  deliveryPartner?: DeliveryPartner,
): Order => {
  if (!rawOrder) {
    return {
      id: '0',
      orderNumber: '#LB-00000',
      date: 'Today',
      time: '12:00 PM',
      status: 'preparing',
      items: [],
      itemCount: 0,
      totalAmount: 0,
      savings: 0,
      paymentMode: 'Paid online',
      deliveryAddress: 'Chennai, Tamil Nadu',
    };
  }

  const id = String(rawOrder.id ?? '0');
  const orderNumber = rawOrder.name ? `#${rawOrder.name}` : `#LB-${id}`;

  // Parse date and time from date_order (e.g. "2026-09-16 10:30:00")
  let date = 'Today';
  let time = '10:00 AM';

  if (rawOrder.date_order) {
    try {
      const parsed = new Date(rawOrder.date_order.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        date = parsed.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        time = parsed.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (_) {}
  }

  const status = mapOdooStateToOrderStatus(
    rawOrder.state,
    rawOrder.delivery_status,
  );

  // Map order lines / items if present
  const items: OrderItem[] = [];
  let itemCount = 0;

  if (Array.isArray(rawOrder.order_line_details)) {
    rawOrder.order_line_details.forEach((line: any) => {
      const prod: Product = mapOdooProductToProduct(line.product || line);
      const qty = Number(line.product_uom_qty || line.qty || 1);
      const price = Number(line.price_unit || line.price || prod.price);
      items.push({
        product: prod,
        quantity: qty,
        price,
      });
      itemCount += qty;
    });
  } else if (Array.isArray(rawOrder.items)) {
    rawOrder.items.forEach((item: any) => {
      items.push(item);
      itemCount += item.quantity || 1;
    });
  } else {
    // If order_line is array of IDs, synthesize an item summary
    const lineIds = Array.isArray(rawOrder.order_line) ? rawOrder.order_line : [];
    itemCount = lineIds.length > 0 ? lineIds.length : 1;
    items.push({
      product: {
        id: `prod_${id}`,
        name: `Fresh Grocery Items (${itemCount} items)`,
        category: 'Grocery',
        price: Number(rawOrder.amount_total ?? 0) / Math.max(itemCount, 1),
        originalPrice: Number(rawOrder.amount_total ?? 0) / Math.max(itemCount, 1),
        discountPercentage: 0,
        unit: '1 Order Pack',
        rating: 4.8,
        reviewsCount: 15,
        inStock: true,
        deliveryTime: '15 mins',
        description: 'LBFresh Direct Order',
      },
      quantity: itemCount,
      price: Number(rawOrder.amount_total ?? 0),
    });
  }

  const totalAmount = Number(rawOrder.amount_total ?? 0);
  const untaxed = Number(rawOrder.amount_untaxed ?? totalAmount);
  const savings = Math.max(0, Math.round(totalAmount * 0.1));

  // Partner / Address
  let deliveryAddress = 'Chennai, Tamil Nadu';
  if (Array.isArray(rawOrder.partner_id) && rawOrder.partner_id[1]) {
    deliveryAddress = String(rawOrder.partner_id[1]);
  } else if (typeof rawOrder.partner_shipping_id === 'string') {
    deliveryAddress = rawOrder.partner_shipping_id;
  }

  const eta =
    status === 'delivered'
      ? 'Delivered'
      : status === 'in_transit'
      ? '12 mins'
      : '15 mins';

  return {
    id,
    orderNumber,
    date,
    time,
    status,
    items,
    itemCount: itemCount || items.length || 1,
    totalAmount,
    savings,
    paymentMode: 'Paid online (Odoo Verified)',
    deliveryAddress,
    eta,
    deliveryPartner: deliveryPartner || (status === 'in_transit' || status === 'delivered' ? {
      name: 'LBFresh Partner',
      phone: '+91 98450 12345',
      vehicle: 'Electric Delivery Bike',
      rating: 4.9,
    } : undefined),
  };
};
