// src/modules/orders/utils/orderMapper.ts
import { DeliveryPartner, Order, OrderItem, OrderStatus } from '../types';
import { Product } from '../../products/types/product';
import { mapOdooProductToProduct } from '../../products/utils/productMapper';
import { API_SETTINGS } from '../../../app/config';

/**
 * Normalizes Odoo `state` and `delivery_status` to our standard `OrderStatus`.
 */
export const mapOdooStateToOrderStatus = (
  state?: any,
  deliveryStatus?: any,
): OrderStatus => {
  const normalizedState = typeof state === 'string' ? state.toLowerCase() : '';
  const normalizedDelivery =
    typeof deliveryStatus === 'string' ? deliveryStatus.toLowerCase() : '';

  if (normalizedState === 'cancel') {
    return 'cancelled';
  }

  if (normalizedDelivery === 'full') {
    return 'delivered';
  }

  // If delivery is in-transit or dispatched
  if (
    normalizedDelivery === 'partial' ||
    normalizedDelivery === 'assigned' ||
    normalizedDelivery === 'started' ||
    normalizedDelivery === 'in_transit'
  ) {
    return 'in_transit';
  }

  // A confirmed sale order (delivery_status === 'pending' or not yet dispatched) is being prepared
  if (normalizedState === 'sale') {
    return 'preparing';
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
      paymentMode: 'Cash on Delivery',
      deliveryAddress: 'Chennai, Tamil Nadu',
    };
  }

  const id = String(rawOrder.id ?? '0');
  const orderNumber = rawOrder.name ? `#${rawOrder.name}` : `#LB-${id}`;

  // Parse date and time from date_order (e.g. "2026-09-16 10:30:00")
  let date = 'Today';
  let time = '10:00 AM';

  if (typeof rawOrder.date_order === 'string' && rawOrder.date_order) {
    try {
      const rawStr = rawOrder.date_order.trim();
      // Odoo always sends date_order in UTC (e.g. "2026-09-22 04:19:37").
      // Appending "Z" ensures the JavaScript Date parser treats it as UTC and correctly converts it to the user's local timezone!
      const isoStr = rawStr.includes('Z') || rawStr.includes('+')
        ? rawStr.replace(' ', 'T')
        : `${rawStr.replace(' ', 'T')}Z`;

      const parsed = new Date(isoStr);
      if (!isNaN(parsed.getTime())) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = parsed.getDate();
        const month = months[parsed.getMonth()];
        const year = parsed.getFullYear();
        let hours = parsed.getHours();
        const minutes = parsed.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

        date = `${day} ${month} ${year}`;
        time = `${hours}:${minutesStr} ${ampm}`;
      }
    } catch (_) {}
  }

  const status = mapOdooStateToOrderStatus(
    rawOrder.state,
    rawOrder.delivery_status,
  );

  // Helper to extract a clean customer-facing product title
  const extractCleanName = (rawName?: string, fallback = 'Grocery Item'): string => {
    if (!rawName) return fallback;
    const firstLine = rawName.split('\n')[0].trim();
    // Strip leading bracketed SKU/code like "[AMBAPP-00023] Ambikka appalam" -> "Ambikka appalam"
    const cleaned = firstLine.replace(/^\[[^\]]+\]\s*/, '').trim();
    return cleaned || firstLine;
  };

  // Map order lines / items if present
  const items: OrderItem[] = [];
  let itemCount = 0;

  if (Array.isArray(rawOrder.order_line_details) && rawOrder.order_line_details.length > 0) {
    rawOrder.order_line_details.forEach((line: any) => {
      const prodId = line.product_id
        ? (Array.isArray(line.product_id) ? String(line.product_id[0]) : String(line.product_id))
        : `line_${line.id}`;
      const rawProdName = Array.isArray(line.product_id) ? line.product_id[1] : (line.name || 'Grocery Item');
      const cleanProdName = extractCleanName(rawProdName);
      const qty = Number(line.product_uom_qty || line.qty || 1);
      const unitPrice = Number(line.price_unit || line.price || 0);

      // Handle base64 image, url, or direct Odoo product image URL
      let imageUrl = line.imageUrl || line.image || undefined;
      if (!imageUrl && line.image_128) {
        imageUrl = `data:image/png;base64,${line.image_128}`;
      }
      if (!imageUrl && prodId && !String(prodId).startsWith('line_') && !isNaN(Number(prodId))) {
        const baseUrl = (API_SETTINGS?.baseUrl || 'https://lbfreshbasket.com').replace(/\/+$/, '');
        imageUrl = `${baseUrl}/web/image/product.product/${prodId}/image_256`;
      }

      const prod: Product = {
        id: prodId,
        name: cleanProdName,
        category: 'Grocery',
        price: unitPrice,
        originalPrice: unitPrice,
        discountPercentage: 0,
        unit: line.uom_name || (Array.isArray(line.product_uom) ? line.product_uom[1] : '1 Pack'),
        imageUrl,
        rating: 4.8,
        reviewsCount: 12,
        inStock: true,
        deliveryTime: '15 mins',
        description: line.name || cleanProdName,
      };

      items.push({
        product: prod,
        quantity: qty,
        price: unitPrice,
      });
      itemCount += qty;
    });
  } else if (Array.isArray(rawOrder.items) && rawOrder.items.length > 0) {
    rawOrder.items.forEach((item: any) => {
      items.push(item);
      itemCount += item.quantity || 1;
    });
  } else {
    // If order_line is array of IDs and lines are being loaded
    const lineIds = Array.isArray(rawOrder.order_line) ? rawOrder.order_line : [];
    itemCount = lineIds.length > 0 ? lineIds.length : 1;
    items.push({
      product: {
        id: `prod_${id}`,
        name: `Order Items (${itemCount} items)`,
        category: 'Grocery',
        price: Number(rawOrder.amount_total ?? 0) / Math.max(itemCount, 1),
        originalPrice: Number(rawOrder.amount_total ?? 0) / Math.max(itemCount, 1),
        discountPercentage: 0,
        unit: '1 Order Pack',
        rating: 0,
        reviewsCount: 0,
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
  const taxAmount = Number(rawOrder.amount_tax ?? 0);
  const savings = Math.max(0, Math.round(totalAmount * 0.05));

  // Partner / Address
  let deliveryAddress = 'Doorstep Delivery';
  if (Array.isArray(rawOrder.partner_shipping_id) && rawOrder.partner_shipping_id[1]) {
    deliveryAddress = String(rawOrder.partner_shipping_id[1]);
  } else if (typeof rawOrder.partner_shipping_id === 'string' && rawOrder.partner_shipping_id) {
    deliveryAddress = rawOrder.partner_shipping_id;
  } else if (Array.isArray(rawOrder.partner_id) && rawOrder.partner_id[1]) {
    deliveryAddress = String(rawOrder.partner_id[1]);
  }

  // Carrier / Delivery service from Odoo
  const carrierName = Array.isArray(rawOrder.carrier_id)
    ? rawOrder.carrier_id[1]
    : typeof rawOrder.carrier_id === 'string'
    ? rawOrder.carrier_id
    : 'Standard Delivery';

  const eta =
    status === 'delivered'
      ? 'Delivered'
      : status === 'in_transit'
      ? '15 mins'
      : 'Preparing';

  // Determine customer payment mode cleanly without hardcoded strings
  let paymentMode = 'Cash on Delivery';
  const clientRef = typeof rawOrder.client_order_ref === 'string' ? rawOrder.client_order_ref.toLowerCase() : '';
  const hasTransactions = Array.isArray(rawOrder.transaction_ids) && rawOrder.transaction_ids.length > 0;

  if (clientRef.includes('cod') || clientRef.includes('cash')) {
    paymentMode = 'Cash on Delivery';
  } else if (
    clientRef.includes('upi') ||
    clientRef.includes('razorpay') ||
    clientRef.includes('online') ||
    hasTransactions
  ) {
    paymentMode = 'Paid online';
  } else if (rawOrder.paymentMode && typeof rawOrder.paymentMode === 'string') {
    const cleanMode = rawOrder.paymentMode.replace(/\s*\(Odoo Verified\)/gi, '').trim();
    paymentMode = cleanMode.toLowerCase().includes('online') || cleanMode.toLowerCase().includes('upi')
      ? 'Paid online'
      : 'Cash on Delivery';
  } else {
    paymentMode = 'Cash on Delivery';
  }

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
    paymentMode,
    deliveryAddress,
    eta,
    deliveryPartner:
      deliveryPartner ||
      (status === 'in_transit' || status === 'delivered'
        ? {
            name: carrierName,
            phone: 'Support via App',
            vehicle: 'Express Doorstep Delivery',
            rating: 4.9,
          }
        : undefined),
  };
};
