import { OdooProductRaw, Product } from '../types/product';
import { API_SETTINGS } from '../../../app/config/apiSettings';

/**
 * Maps an Odoo JSON-RPC product item (e.g. from deal_of_the_day, category products)
 * to the mobile app's standard Product model.
 */
export const mapOdooProductToProduct = (item: any): Product => {
  if (!item) {
    return {
      id: '0',
      name: 'Unknown Product',
      category: 'Grocery',
      price: 0,
      originalPrice: 0,
      discountPercentage: 0,
      unit: '1 Unit',
      rating: 4.5,
      reviewsCount: 0,
      inStock: true,
      deliveryTime: '15 mins',
      description: '',
    };
  }

  const id = String(item.id ?? '');
  const name = String(item.name ?? 'Fresh Product');

  // Category Extraction: e.g. [10, "Groceries / Salt & Sugar"] -> "Salt & Sugar"
  let category = 'Grocery';
  if (Array.isArray(item.categ_id) && item.categ_id[1]) {
    const parts = String(item.categ_id[1]).split('/');
    category = parts[parts.length - 1].trim();
  } else if (typeof item.category === 'string' && item.category) {
    category = item.category;
  }

  // Price Calculation:
  // - discounted_price or list_price
  const listPrice = Number(item.list_price ?? 0);
  const mrpPrice = Number(item.mrp_price ?? 0);
  const discountedPrice = Number(item.discounted_price ?? 0);

  let price = discountedPrice > 0 ? discountedPrice : listPrice;
  if (price === 0 && Number(item.price ?? 0) > 0) {
    price = Number(item.price);
  }

  // Original / Strikethrough price:
  // - mrp_price if > 0 and > price
  // - list_price if > price
  let originalPrice = mrpPrice > 0 ? mrpPrice : listPrice;
  if (originalPrice <= price && Number(item.originalPrice ?? 0) > 0) {
    originalPrice = Number(item.originalPrice);
  }

  // Discount Percentage
  let discountPercentage = Number(item.discount_percentage ?? 0);
  if (discountPercentage === 0 && originalPrice > price && originalPrice > 0) {
    discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  // Unit Extraction: e.g. "Units", "Kg", or extracted from product title (e.g. "100G", "30Kg")
  let unit = item.uom_name || (Array.isArray(item.uom_id) ? item.uom_id[1] : (item.unit || '1 Unit'));
  const weightMatch = name.match(/(\d+(\.\d+)?\s*(kg|g|gm|l|ml|ltr|pack|pcs|units|kg|g|g\b|kg\b))/i);
  if (weightMatch && (!unit || unit === 'Units' || unit === 'Unit')) {
    unit = weightMatch[0].toUpperCase();
  }

  // Rating & Review count
  const avgRating = Number(item.lb_rating_avg ?? 0);
  const rating = avgRating > 0 ? avgRating : (Number(item.rating ?? 0) > 0 ? Number(item.rating) : 4.5);
  const reviewsCount = Number(item.lb_review_count ?? item.reviewsCount ?? 0);

  // Delivery Time: e.g. delivery_time_days = 1 -> "1 day"
  let deliveryTime = '15 mins';
  if (item.delivery_time_days !== undefined && item.delivery_time_days !== null) {
    const days = Number(item.delivery_time_days);
    if (days === 0) {
      deliveryTime = '15 mins';
    } else if (days === 1) {
      deliveryTime = '1 day';
    } else if (days > 1) {
      deliveryTime = `${days} days`;
    }
  } else if (item.deliveryTime) {
    deliveryTime = item.deliveryTime;
  }

  // Stock
  const inStock = item.qty_available !== undefined ? Number(item.qty_available) >= 0 : true;

  // Description
  const description =
    typeof item.description_sale === 'string' && item.description_sale.trim()
      ? item.description_sale.trim()
      : typeof item.description === 'string' && item.description.trim()
      ? item.description.trim()
      : '';

  // Image URL from Odoo backend
  const baseUrl = API_SETTINGS.baseUrl.replace(/\/+$/, '');
  const imageUrl =
    item.imageUrl ||
    `${baseUrl}/web/image/product.template/${item.id}/image_512`;

  return {
    ...item,
    id,
    name,
    category,
    price,
    originalPrice,
    discountPercentage,
    unit,
    rating,
    reviewsCount,
    inStock,
    deliveryTime,
    description,
    imageUrl,
    tags: Array.isArray(item.product_tag_ids) ? item.product_tag_ids.map(String) : [],
  };
};
