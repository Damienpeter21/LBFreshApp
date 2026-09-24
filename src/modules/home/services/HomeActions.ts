// src/modules/home/services/HomeActions.ts
import {
  ODOO_CONFIG,
  callOdooCustomApi,
  callOdooRpc,
} from '../../../app/config';

export { ODOO_CONFIG };

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home Promotional Banners (Loyalty Programs)
// Postman: "Banner" (item 15) & "Loyalty Program" (item 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches promotional banners from active loyalty programs.
 * Method: POST to /jsonrpc (model: loyalty.program, method: search_read)
 */
export const homeBanner = async (limit = 50): Promise<any> => {
  try {
    const res = await callOdooRpc(
      'loyalty.program',
      'search_read',
      [
        [
          ['active', '=', true],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'date_from',
          'date_to',
          'program_type',
          'trigger',
          'trigger_product_ids',
          'reward_ids',
          'rule_ids',
        ],
        order: 'sequence asc',
        limit,
      },
    );
    if (Array.isArray(res?.result) && res.result.length > 0) {
      return res;
    }
    return { result: [] };
  } catch (err) {
    console.warn('[homeBanner Note] loyalty.program search_read unavailable, using default banners:', (err as any)?.message || err);
    return { result: [] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Product Categories
// Postman: "All Product Category" (item 6)
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryQueryOptions {
  onlyWithProducts?: boolean;
  limit?: number;
}

/**
 * Fetches product categories.
 * Method: POST to /jsonrpc (model: product.category, method: search_read)
 * Fields: Includes product_count from Postman collection
 */
export const getProductCategoriesData = async (
  options?: CategoryQueryOptions,
): Promise<any> => {
  const responseData = await callOdooRpc(
    'product.category',
    'search_read',
    [[]],
    {
      fields: [
        'id',
        'name',
        'complete_name',
        'parent_id',
        'product_count',
      ],
      order: 'name asc', // Sort alphabetically (sequence not available on product.category)
      ...(options?.limit ? { limit: options.limit } : {}),
    },
  );

  if (!Array.isArray(responseData?.result)) {
    return responseData;
  }

  // ── Step 1: Filter internal / empty categories ────────────────────────────
  const EXCLUDED_NAMES = new Set(['Expenses', 'Saleable', 'Deliveries', 'All']);
  let filtered: any[] = responseData.result.filter((cat: any) => {
    if (EXCLUDED_NAMES.has(cat.name)) return false;
    if (options?.onlyWithProducts && Number(cat.product_count ?? 0) === 0) return false;
    return true;
  });

  // ── Step 2: Deduplicate by complete_name ──────────────────────────────────
  // Odoo can have the same logical category at multiple hierarchy levels
  // (e.g. "All / Fruits" AND "All / Grocery / Fruits") causing duplicates in UI.
  // Keep the entry with the highest product_count when complete_name collides.
  const seenCompleteNames = new Map<string, any>();
  for (const cat of filtered) {
    const key = (cat.complete_name ?? cat.name ?? '').trim().toLowerCase();
    const existing = seenCompleteNames.get(key);
    if (!existing) {
      seenCompleteNames.set(key, cat);
    } else {
      // Prefer the entry with more products
      if (Number(cat.product_count ?? 0) > Number(existing.product_count ?? 0)) {
        seenCompleteNames.set(key, cat);
      }
    }
  }
  filtered = Array.from(seenCompleteNames.values());

  // ── Step 3: Re-sort after dedup (alphabetical by name) ──────────────────
  filtered.sort((a: any, b: any) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );

  return {
    ...responseData,
    result: filtered,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Deals of the Day
// Postman: "Deals of the Day" (item 13)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches current deals of the day products.
 * Method: POST to /jsonrpc (model: product.template, method: search_read)
 */
export const getDealoftheDay = async (limit = 20): Promise<any> => {
  try {
    const response = await callOdooRpc(
      'product.template',
      'search_read',
      [
        [
          ['is_deal_of_the_day', '=', true],
          ['sale_ok', '=', true],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'list_price',
          'mrp_price',
          'discount_percentage',
          'discounted_price',
          'categ_id',
          'qty_available',
          'uom_id',
          'uom_name',
          'delivery_time_days',
          'sale_delay',
          'is_deal_of_the_day',
          'description_sale',
          'description',
          'product_tag_ids',
          'product_variant_id',
          'product_variant_ids',
          'lb_rating_avg',
          'lb_review_count',
        ],
        limit,
      },
    );

    const deals = response?.result;
    if (Array.isArray(deals) && deals.length > 0) {
      return response;
    }

    // Fallback: If no products marked as deal of the day, fetch top discounted/active products
    const fallback = await callOdooRpc(
      'product.template',
      'search_read',
      [[['sale_ok', '=', true]]],
      {
        fields: [
          'id',
          'name',
          'list_price',
          'mrp_price',
          'discount_percentage',
          'discounted_price',
          'categ_id',
          'qty_available',
          'uom_id',
          'uom_name',
          'delivery_time_days',
          'sale_delay',
          'is_deal_of_the_day',
          'description_sale',
          'description',
          'product_tag_ids',
          'product_variant_id',
          'product_variant_ids',
          'lb_rating_avg',
          'lb_review_count',
        ],
        order: 'discount_percentage desc, id desc',
        limit: Math.min(limit, 10),
      },
    );
    return fallback;
  } catch (error) {
    console.warn('Error in getDealoftheDay, using fallback:', error);
    return await callOdooRpc(
      'product.template',
      'search_read',
      [[['sale_ok', '=', true]]],
      {
        fields: [
          'id',
          'name',
          'list_price',
          'mrp_price',
          'discount_percentage',
          'discounted_price',
          'categ_id',
          'qty_available',
          'uom_id',
          'uom_name',
          'delivery_time_days',
          'product_variant_id',
          'product_variant_ids',
          'description_sale',
          'description',
          'product_tag_ids',
          'lb_rating_avg',
          'lb_review_count',
        ],
        order: 'id desc',
        limit: 10,
      },
    ).catch(() => ({ result: [] }));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. New Arrivals
// Postman: "All New Arraivals" (item 12)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches newly arrived products (website_ribbon_id = "New Arrivals").
 * Method: POST to /jsonrpc (model: product.template, method: search_read)
 * Includes smart fallback if ribbon count is low.
 */
export const getNewArrival = async (limit = 30): Promise<any> => {
  try {
    const responseData = await callOdooRpc(
      'product.template',
      'search_read',
      [
        [
          ['website_ribbon_id.name', '=', 'New Arrivals'],
          ['sale_ok', '=', true],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'list_price',
          'mrp_price',
          'discount_percentage',
          'discounted_price',
          'categ_id',
          'qty_available',
          'uom_id',
          'uom_name',
          'delivery_time_days',
          'description_sale',
          'description',
          'product_tag_ids',
          'product_variant_id',
          'product_variant_ids',
          'lb_rating_avg',
          'lb_review_count',
          'website_ribbon_id',
          'website_published',
        ],
        order: 'id desc',
        limit,
      },
    );

    // Fallback: If Ribbon returns fewer than 3 products, supplement with latest active products
    const ribbonProducts = responseData?.result;
    if (Array.isArray(ribbonProducts) && ribbonProducts.length < 3) {
      try {
        const fallbackRes = await callOdooRpc(
          'product.template',
          'search_read',
          [[['sale_ok', '=', true]]],
          {
            fields: [
              'id',
              'name',
              'list_price',
              'mrp_price',
              'discount_percentage',
              'discounted_price',
              'categ_id',
              'qty_available',
              'uom_id',
              'uom_name',
              'delivery_time_days',
              'description_sale',
              'description',
              'product_tag_ids',
              'product_variant_id',
              'product_variant_ids',
              'lb_rating_avg',
              'lb_review_count',
            ],
            order: 'id desc',
            limit: Math.max(10, limit),
          },
        );

        const fallbackProducts = fallbackRes?.result || [];
        const existingIds = new Set(ribbonProducts.map((p: any) => p.id));
        const merged = [
          ...ribbonProducts,
          ...fallbackProducts.filter((p: any) => !existingIds.has(p.id)),
        ].slice(0, limit);

        return {
          ...responseData,
          result: merged,
        };
      } catch (fallbackError) {
        console.warn('Fallback in getNewArrival failed:', fallbackError);
      }
    }

    return responseData;
  } catch (error) {
    console.warn('Error in getNewArrival, using fallback:', error);
    return await callOdooRpc(
      'product.template',
      'search_read',
      [[['sale_ok', '=', true]]],
      {
        fields: [
          'id',
          'name',
          'list_price',
          'mrp_price',
          'discount_percentage',
          'discounted_price',
          'categ_id',
          'qty_available',
          'uom_id',
          'uom_name',
          'delivery_time_days',
          'product_variant_id',
          'product_variant_ids',
          'description_sale',
          'description',
          'product_tag_ids',
          'lb_rating_avg',
          'lb_review_count',
        ],
        order: 'id desc',
        limit: Math.max(10, limit),
      },
    ).catch(() => ({ result: [] }));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Popular Products / Top Selling Products
// Postman: "Top Selling Products" (item 16)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches top selling / popular products.
 * Method: POST to /api/products/top_selling (Odoo custom Top Selling API)
 * Automatically normalizes response.data.result to an Array of products for UI compatibility.
 */
export const getPopularProducts = async (): Promise<any> => {
  try {
    const responseData = await callOdooCustomApi('/api/products/top_selling');
    const rawResult = responseData?.result;
    const products = Array.isArray(rawResult)
      ? rawResult
      : Array.isArray(rawResult?.products)
      ? rawResult.products
      : [];

    if (products.length > 0) {
      const missingVariantIds = products
        .filter((p: any) => !p.product_variant_id)
        .map((p: any) => p.id);
      if (missingVariantIds.length > 0) {
        try {
          const tmplRes = await callOdooRpc(
            'product.template',
            'search_read',
            [[['id', 'in', missingVariantIds]]],
            {
              fields: ['id', 'product_variant_id', 'product_variant_ids'],
            },
          );
          const list = Array.isArray(tmplRes?.result) ? tmplRes.result : [];
          const tmplMap = new Map(list.map((t: any) => [t.id, t.product_variant_id]));
          products.forEach((p: any) => {
            if (!p.product_variant_id && tmplMap.has(p.id)) {
              p.product_variant_id = tmplMap.get(p.id);
            }
          });
        } catch (err) {
          console.warn('Could not enrich top selling variants:', err);
        }
      }

      return {
        ...responseData,
        result: products,
      };
    }

    return await getPopularProductsFallback();
  } catch (error) {
    console.warn(
      'Primary getPopularProducts (/api/products/top_selling) failed, using fallback:',
      error,
    );
    return await getPopularProductsFallback();
  }
};

/**
 * Robust fallback for popular products if the dedicated top_selling route is unavailable.
 */
const getPopularProductsFallback = async (limit = 20): Promise<any> => {
  return callOdooRpc(
    'product.template',
    'search_read',
    [[['sale_ok', '=', true]]],
    {
      fields: [
        'id',
        'name',
        'list_price',
        'mrp_price',
        'discount_percentage',
        'discounted_price',
        'categ_id',
        'qty_available',
        'uom_id',
        'uom_name',
        'delivery_time_days',
        'description_sale',
        'description',
        'product_tag_ids',
        'product_variant_id',
        'product_variant_ids',
        'lb_rating_avg',
        'lb_review_count',
      ],
      order: 'id desc',
      limit,
    },
  );
};

/** Alias for getPopularProducts */
export const getTopSellingProducts = getPopularProducts;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Additional Home & Product APIs from Postman Collection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches products with active discounts.
 * Postman: "Discount" (item 8)
 */
export const getDiscountedProducts = async (limit = 20): Promise<any> => {
  return callOdooRpc(
    'product.template',
    'search_read',
    [
      [
        ['sale_ok', '=', true],
        ['discount_percentage', '>', 0],
      ],
    ],
    {
      fields: [
        'id',
        'name',
        'list_price',
        'mrp_price',
        'discount_percentage',
        'discounted_price',
        'categ_id',
        'qty_available',
        'uom_id',
        'uom_name',
        'delivery_time_days',
        'description_sale',
        'description',
        'product_tag_ids',
        'product_variant_id',
        'product_variant_ids',
        'lb_rating_avg',
        'lb_review_count',
      ],
      limit,
    },
  );
};

/**
 * Fetches delivery time details for all products.
 * Postman: "Delivery Time all Products" (item 14)
 */
export const getDeliveryTimeProducts = async (limit = 50): Promise<any> => {
  return callOdooRpc(
    'product.template',
    'search_read',
    [[['sale_ok', '=', true]]],
    {
      fields: [
        'id',
        'name',
        'list_price',
        'mrp_price',
        'discount_percentage',
        'discounted_price',
        'categ_id',
        'qty_available',
        'uom_id',
        'uom_name',
        'delivery_time_days',
        'sale_delay',
        'description_sale',
        'description',
        'product_tag_ids',
        'lb_rating_avg',
        'lb_review_count',
      ],
      limit,
    },
  );
};

/**
 * Fetches product availability (in stock products from product.product).
 * Postman: "GET Product Availability" (item 4)
 */
export const getProductAvailability = async (limit = 20): Promise<any> => {
  return callOdooRpc(
    'product.product',
    'search_read',
    [
      [
        ['qty_available', '>', 0],
        ['sale_ok', '=', true],
      ],
    ],
    {
      fields: [
        'id',
        'name',
        'list_price',
        'mrp_price',
        'discount_percentage',
        'discounted_price',
        'categ_id',
        'qty_available',
        'virtual_available',
        'free_qty',
        'uom_id',
        'uom_name',
        'delivery_time_days',
        'description_sale',
        'description',
        'product_tag_ids',
        'lb_rating_avg',
        'lb_review_count',
      ],
      limit,
    },
  );
};

/**
 * Fetches products filtered specifically by category ID.
 * Postman: "Products Category Wise" (item 5) & "GET Product By Category" (item 2)
 */
export const getProductsCategoryWise = async (
  categoryId: number | string,
  limit = 20,
): Promise<any> => {
  return callOdooRpc(
    'product.template',
    'search_read',
    [
      [
        ['categ_id', '=', Number(categoryId)],
        ['sale_ok', '=', true],
      ],
    ],
    {
      fields: [
        'id',
        'name',
        'list_price',
        'mrp_price',
        'discount_percentage',
        'discounted_price',
        'categ_id',
        'qty_available',
        'uom_id',
        'uom_name',
        'delivery_time_days',
        'description_sale',
        'description',
        'product_tag_ids',
        'product_variant_id',
        'product_variant_ids',
        'lb_rating_avg',
        'lb_review_count',
      ],
      limit,
    },
  );
};

/** Alias for getProductsCategoryWise */
export const getProductsByCategory = getProductsCategoryWise;

/**
 * Fetches active promotion loyalty programs.
 * Postman: "Loyalty Program" (item 7)
 */
export const getLoyaltyPrograms = async (limit = 10): Promise<any> => {
  return callOdooRpc(
    'loyalty.program',
    'search_read',
    [
      [
        ['active', '=', true],
        ['program_type', '=', 'promotion'],
      ],
    ],
    {
      fields: [
        'id',
        'name',
        'program_type',
        'trigger',
        'trigger_product_ids',
        'rule_ids',
        'reward_ids',
        'company_id',
        'currency_id',
        'date_from',
        'date_to',
      ],
      limit,
    },
  );
};