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
    normalizedDelivery === 'in_transit'
  ) {
    return 'in_transit';
  }

  // If warehouse has started processing / assigned / packing
  if (normalizedDelivery === 'started' || normalizedDelivery === 'assigned') {
    return 'preparing';
  }

  // A confirmed sale order where delivery is pending or newly placed
  if (normalizedState === 'sale') {
    return 'confirmed';
  }

  if (normalizedState === 'draft' || normalizedState === 'sent') {
    return 'confirmed';
  }

  return 'confirmed';
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
      status: 'confirmed',
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
  // Track MRP total (before discounts) to compute real savings
  let mrpTotal = 0;
  let detectedDeliveryFee: number | undefined;

  if (Array.isArray(rawOrder.order_line_details) && rawOrder.order_line_details.length > 0) {
    rawOrder.order_line_details.forEach((line: any) => {
      // Detect if this line is a Delivery Charge line from Odoo
      const isDeliveryLine =
        Boolean(line.is_delivery) ||
        (typeof line.name === 'string' && /delivery\s*charge/i.test(line.name)) ||
        (Array.isArray(line.product_id) && typeof line.product_id[1] === 'string' && /delivery\s*charge/i.test(line.product_id[1]));

      if (isDeliveryLine) {
        const lineFee = Number(line.price_total ?? line.price_subtotal ?? line.price_unit ?? 0);
        if (lineFee >= 0) {
          detectedDeliveryFee = (detectedDeliveryFee ?? 0) + lineFee;
        }
        return; // Exclude from grocery items list
      }

      const prodId = line.product_id
        ? (Array.isArray(line.product_id) ? String(line.product_id[0]) : String(line.product_id))
        : `line_${line.id}`;
      const rawProdName = Array.isArray(line.product_id) ? line.product_id[1] : (line.name || 'Grocery Item');
      const cleanProdName = extractCleanName(rawProdName);
      const qty = Number(line.product_uom_qty || line.qty || 1);

      // price_unit = MRP (before discount). price_subtotal = actual amount paid for this line.
      // Use effective unit price (subtotal / qty) so the displayed per-unit price reflects the discount.
      const mrpUnitPrice = Number(line.price_unit || 0);
      const lineSubtotal = Number(line.price_subtotal ?? (mrpUnitPrice * qty));
      const effectiveUnitPrice = qty > 0 ? Math.round((lineSubtotal / qty) * 100) / 100 : mrpUnitPrice;

      // Accumulate MRP total so we can compute real savings later
      mrpTotal += mrpUnitPrice * qty;

      // ── Image resolution (3-layer strategy) ──────────────────────────────
      // Layer 1: direct field overrides (already a URL or passed externally)
      let imageUrl: string | undefined = line.imageUrl || line.image || undefined;

      // Layer 2: base64 fields from Odoo — prefer image_256 > image_128 > image_512 > image_1920.
      //          Odoo returns product images as JPEG, so use jpeg MIME type.
      //          Odoo returns `false` (boolean) when no image is set — must guard against that.
      if (!imageUrl) {
        const b64_256  = typeof line.image_256  === 'string' && line.image_256.trim()  ? line.image_256.trim()  : null;
        const b64_128  = typeof line.image_128  === 'string' && line.image_128.trim()  ? line.image_128.trim()  : null;
        const b64_512  = typeof line.image_512  === 'string' && line.image_512.trim()  ? line.image_512.trim()  : null;
        const b64_1920 = typeof line.image_1920 === 'string' && line.image_1920.trim() ? line.image_1920.trim() : null;
        const b64 = b64_256 || b64_128 || b64_512 || b64_1920;
        if (b64) {
          // If Odoo already prefixed the data URI, use it as-is; otherwise wrap it
          imageUrl = b64.startsWith('data:image')
            ? b64
            : `data:image/jpeg;base64,${b64}`;
        }
      }

      // Layer 3: web URL fallback — use the same URL pattern that works throughout the app:
      //          product.template/{tmplId}/image_512  (most reliable — template always has image)
      //          product.product/{prodId}/image_512   (variant fallback if tmplId not available)
      //
      //  NOTE: image_256 does NOT exist on this Odoo instance — use image_512 everywhere.
      const _baseUrl = (API_SETTINGS?.baseUrl || 'https://lbfreshbasket.com').replace(/\/+$/, '');

      // Prefer product.template URL (same as productMapper and ProductCard)
      if (!imageUrl && line.product_tmpl_id) {
        const tmplId = Array.isArray(line.product_tmpl_id)
          ? line.product_tmpl_id[0]
          : line.product_tmpl_id;
        if (tmplId && !isNaN(Number(tmplId))) {
          imageUrl = `${_baseUrl}/web/image/product.template/${tmplId}/image_512`;
        }
      }

      // product.product fallback (variant-level) if template ID is not available
      if (!imageUrl && prodId && !String(prodId).startsWith('line_') && !isNaN(Number(prodId))) {
        imageUrl = `${_baseUrl}/web/image/product.product/${prodId}/image_512`;
      }

      // Compute per-item discount percentage for display
      const discountPct = mrpUnitPrice > 0 && effectiveUnitPrice < mrpUnitPrice
        ? Math.round(((mrpUnitPrice - effectiveUnitPrice) / mrpUnitPrice) * 100)
        : Number(line.discount || 0);

      const prod: Product = {
        id: prodId,
        name: cleanProdName,
        category: 'Grocery',
        price: effectiveUnitPrice,
        originalPrice: mrpUnitPrice,
        discountPercentage: discountPct,
        unit: (Array.isArray(line.product_uom) ? line.product_uom[1] : null) || '1 Pack',
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
        price: effectiveUnitPrice,
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

  // Compute real savings:
  // If we mapped line details, use sum(price_unit * qty) - amount_total.
  // Otherwise fall back to any discount stored on the raw order.
  let savings = 0;
  if (mrpTotal > 0 && totalAmount > 0) {
    // mrpTotal is sum of MRP across all lines; savings = MRP - what customer actually paid
    savings = Math.max(0, Math.round((mrpTotal - totalAmount) * 100) / 100);
  } else {
    // Fallback: use Odoo coupon discount field if present (sale.order discount_amount)
    const rawDiscount = Number(rawOrder.reward_amount ?? rawOrder.discount_amount ?? 0);
    savings = rawDiscount > 0 ? rawDiscount : 0;
  }

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
      : status === 'preparing'
      ? 'Packing'
      : 'Confirmed';

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

  // Delivery fee from Odoo sale.order amount_delivery or detected delivery charge line
  const rawDeliveryAmount = Number(rawOrder.amount_delivery ?? 0);
  const deliveryFee = rawDeliveryAmount > 0
    ? rawDeliveryAmount
    : (detectedDeliveryFee !== undefined ? detectedDeliveryFee : 0);

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
    deliveryFee,
  };
};
