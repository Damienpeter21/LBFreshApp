import {
  API_SETTINGS,
  ODOO_CONFIG,
  callOdooCustomApi,
  callOdooRpc,
} from '../../../app/config';
import { storage } from '../../../storage';

export { ODOO_CONFIG };

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Format Odoo Image
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes Odoo image fields (e.g. image_1920, image_512) into valid URI.
 * Handles raw base64 string or remote HTTP/HTTPS url.
 */
export const formatOdooImage = (rawImage?: any): string | undefined => {
  if (!rawImage || typeof rawImage !== 'string' || rawImage === 'false') {
    return undefined;
  }
  const trimmed = rawImage.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home Promotional Banners (Loyalty Programs)
// Postman: "Banner Image API" / "Loyalty Program"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches promotional banners from active loyalty programs with image_1920.
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
          ['sale_ok', '=', true],
        ],
      ],
      {
        fields: [
          'id',
          'name',
          'date_from',
          'date_to',
          'program_type',
          'trigger_product_ids',
          'reward_ids',
          'image_1920',
        ],
        order: 'sequence asc',
        limit,
      },
    );
    if (Array.isArray(res?.result) && res.result.length > 0) {
      return {
        ...res,
        result: res.result.map((item: any) => ({
          ...item,
          imageUrl: formatOdooImage(item.image_1920),
        })),
      };
    }
    // Fallback: If sale_ok filter is not set on loyalty programs, query active ones
    const fallbackRes = await callOdooRpc(
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
          'trigger_product_ids',
          'reward_ids',
          'image_1920',
        ],
        order: 'sequence asc',
        limit,
      },
    );
    if (Array.isArray(fallbackRes?.result) && fallbackRes.result.length > 0) {
      return {
        ...fallbackRes,
        result: fallbackRes.result.map((item: any) => ({
          ...item,
          imageUrl: formatOdooImage(item.image_1920),
        })),
      };
    }
    return { result: [] };
  } catch (err) {
    console.warn('[homeBanner Note] loyalty.program search_read unavailable, using default banners:', (err as any)?.message || err);
    return { result: [] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Product Categories
// Postman: "Product category Image" / "All Product Category"
export const CATEGORIES_STORAGE_KEY = '@lb_fresh_categories_cache_v2';

export const DEFAULT_ACTIVE_CATEGORIES: any[] = [
  { id: 43, name: 'Baby Care', complete_name: 'Baby Care', product_count: 38 },
  { id: 39, name: 'Bakery & Cakes', complete_name: 'Bakery & Cakes', product_count: 36 },
  { id: 32, name: 'Bath & Body', complete_name: 'Bath & Body', product_count: 72 },
  { id: 38, name: 'Biscuits & Cookies', complete_name: 'Biscuits & Cookies', product_count: 68 },
  { id: 37, name: 'Chocolates & Confectionery', complete_name: 'Chocolates & Confectionery', product_count: 74 },
  { id: 49, name: 'Cleaning & Laundry', complete_name: 'Cleaning & Laundry', product_count: 48 },
  { id: 47, name: 'Cooking Oils & Ghee', complete_name: 'Cooking Oils & Ghee', product_count: 31 },
  { id: 46, name: 'Dairy, Milk & Breakfast', complete_name: 'Dairy, Milk & Breakfast', product_count: 36 },
  { id: 11, name: 'Detergents & Fabric Care', complete_name: 'Detergents & Fabric Care', product_count: 49 },
  { id: 17, name: 'Dry Fruits & Nuts', complete_name: 'Dry Fruits & Nuts', product_count: 45 },
  { id: 54, name: 'Feminine Hygiene', complete_name: 'Feminine Hygiene', product_count: 46 },
  { id: 31, name: 'Fragrance', complete_name: 'Fragrance', product_count: 52 },
  { id: 41, name: 'Fruits', complete_name: 'Fruits', product_count: 2 },
  { id: 26, name: 'General', complete_name: 'General', product_count: 178 },
  { id: 30, name: 'Hair Care', complete_name: 'Hair Care', product_count: 91 },
  { id: 14, name: 'Health & Wellness', complete_name: 'Health & Wellness', product_count: 15 },
  { id: 51, name: 'Ice Cream', complete_name: 'Ice Cream', product_count: 32 },
  { id: 9, name: 'Masalas & Spices', complete_name: 'Masalas & Spices', product_count: 109 },
  { id: 16, name: 'Noodles, Pasta & Vermicelli', complete_name: 'Noodles, Pasta & Vermicelli', product_count: 39 },
  { id: 42, name: 'Oral Care', complete_name: 'Oral Care', product_count: 57 },
  { id: 12, name: 'Personal Hygiene', complete_name: 'Personal Hygiene', product_count: 4 },
  { id: 58, name: 'Plastic Items', complete_name: 'Plastic Items', product_count: 78 },
  { id: 59, name: 'Pooja Items', complete_name: 'Pooja Items', product_count: 26 },
  { id: 45, name: 'Pulses & Lentils', complete_name: 'Pulses & Lentils', product_count: 46 },
  { id: 27, name: 'Rice, Flour & Grains', complete_name: 'Rice, Flour & Grains', product_count: 60 },
  { id: 10, name: 'Salt & Sugar', complete_name: 'Salt & Sugar', product_count: 19 },
  { id: 56, name: 'Sauces, Pickles & Spreads', complete_name: 'Sauces, Pickles & Spreads', product_count: 32 },
  { id: 36, name: 'Shaving & Grooming', complete_name: 'Shaving & Grooming', product_count: 32 },
  { id: 29, name: 'Skin Care', complete_name: 'Skin Care', product_count: 96 },
  { id: 35, name: 'Snacks & Namkeen', complete_name: 'Snacks & Namkeen', product_count: 55 },
  { id: 24, name: 'Stationery & School Supplies', complete_name: 'Stationery & School Supplies', product_count: 96 },
  { id: 25, name: 'Tea, Coffee & Health Drinks', complete_name: 'Tea, Coffee & Health Drinks', product_count: 38 },
  { id: 53, name: 'Vegetables', complete_name: 'Vegetables', product_count: 8 },
  { id: 34, name: 'Water & Soft Drinks', complete_name: 'Water & Soft Drinks', product_count: 40 },
].map(c => ({
  ...c,
  imageUrl: `${API_SETTINGS.baseUrl}/web/image/product.category/${c.id}/image_1920?width=256&height=256`,
}));

export interface CategoryQueryOptions {
  onlyWithProducts?: boolean;
  limit?: number;
  includeBase64Image?: boolean;
}

/**
 * Fetches product categories with lightweight metadata and fast, native-cached web image URLs.
 * Replaces massive 18MB base64 JSON payload with a fast 4KB response to ensure categories
 * load reliably on all mobile devices regardless of network speed or memory constraints.
 */
export const getProductCategoriesData = async (
  options?: CategoryQueryOptions,
): Promise<any> => {
  const fields = [
    'id',
    'name',
    'complete_name',
    'parent_id',
    'product_count',
    'write_date',
    ...(options?.includeBase64Image ? ['image_1920'] : []),
  ];

  try {
    const responseData = await callOdooRpc(
      'product.category',
      'search_read',
      [[]],
      {
        fields,
        order: 'name asc', // Sort alphabetically
        ...(options?.limit ? { limit: options.limit } : {}),
      },
    );

    if (Array.isArray(responseData?.result) && responseData.result.length > 0) {
      // ── Step 1: Filter internal / empty categories ────────────────────────────
      const EXCLUDED_NAMES = new Set([
        'expenses',
        'saleable',
        'deliveries',
        'all',
        'all category',
        'all categories',
        'zall',
      ]);
      let filtered: any[] = responseData.result.filter((cat: any) => {
        const rawName = (cat.name ?? '').trim().toLowerCase();
        if (EXCLUDED_NAMES.has(rawName)) return false;
        if (options?.onlyWithProducts && Number(cat.product_count ?? 0) === 0) return false;
        return true;
      });

      // ── Step 2: Deduplicate by complete_name ──────────────────────────────────
      // Odoo can have the same logical category at multiple hierarchy levels.
      // Keep the entry with the highest product_count when complete_name collides.
      const seenCompleteNames = new Map<string, any>();
      for (const cat of filtered) {
        const key = (cat.complete_name ?? cat.name ?? '').trim().toLowerCase();
        const existing = seenCompleteNames.get(key);
        if (!existing) {
          seenCompleteNames.set(key, cat);
        } else {
          if (Number(cat.product_count ?? 0) > Number(existing.product_count ?? 0)) {
            seenCompleteNames.set(key, cat);
          }
        }
      }
      filtered = Array.from(seenCompleteNames.values());

      // ── Step 3: Re-sort after dedup (alphabetical by name) and format images ──
      filtered.sort((a: any, b: any) =>
        (a.name ?? '').localeCompare(b.name ?? '')
      );

      const baseUrl = API_SETTINGS.baseUrl;
      const formattedResult = filtered.map((cat: any) => {
        const uniqueParam = cat.write_date ? `&unique=${encodeURIComponent(cat.write_date)}` : '';
        const webImageUrl = cat.id
          ? `${baseUrl}/web/image/product.category/${cat.id}/image_1920?width=256&height=256${uniqueParam}`
          : undefined;

        return {
          ...cat,
          imageUrl: (cat.image_1920 ? formatOdooImage(cat.image_1920) : undefined) || webImageUrl,
        };
      });

      // Cache lightweight categories for instant offline / fallback access
      storage.setJson(CATEGORIES_STORAGE_KEY, formattedResult).catch(() => {});

      return {
        ...responseData,
        result: formattedResult,
      };
    }
  } catch (err) {
    console.warn('[HomeActions] getProductCategoriesData network fetch failed:', (err as any)?.message || err);
  }

  // Fallback 1: Local storage cached categories
  try {
    const cached = await storage.getJson<any[]>(CATEGORIES_STORAGE_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
      return { result: cached };
    }
  } catch (_) {}

  // Fallback 2: Default pre-seeded categories (guarantees category section NEVER disappears on ANY device)
  return { result: DEFAULT_ACTIVE_CATEGORIES };
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

// ─────────────────────────────────────────────────────────────────────────────
// 7. Terms & Conditions and 24/7 Support API
// Postman: "Terms & conditions, 24/7 support"
// ─────────────────────────────────────────────────────────────────────────────

export interface TermsAndSupportData {
  supportEmail: string;
  supportPhone: string;
  termsAndConditions: string;
}

/**
 * Fetches terms & conditions, support email, and 24/7 support phone from ir.config_parameter.
 * Method: POST to /jsonrpc (model: ir.config_parameter, method: search_read)
 */
export const getTermsAndConditionsAndSupport = async (): Promise<TermsAndSupportData> => {
  const fallbackData: TermsAndSupportData = {
    supportEmail: '',
    supportPhone: '',
    termsAndConditions: '',
  };

  try {
    const res = await callOdooRpc(
      'ir.config_parameter',
      'search_read',
      [
        [
          [
            'key',
            'in',
            [
              'lbmart_delivery.support_email',
              'lbmart_delivery.support_phone',
              'lbmart_delivery.terms_and_conditions',
            ],
          ],
        ],
      ],
      {
        fields: ['key', 'value'],
      },
    );

    if (Array.isArray(res?.result) && res.result.length > 0) {
      const map: Record<string, string> = {};
      for (const item of res.result) {
        if (item?.key && item?.value !== undefined && item?.value !== false) {
          map[item.key] = String(item.value);
        }
      }

      return {
        supportEmail: map['lbmart_delivery.support_email'] || fallbackData.supportEmail,
        supportPhone: map['lbmart_delivery.support_phone'] || fallbackData.supportPhone,
        termsAndConditions:
          map['lbmart_delivery.terms_and_conditions'] || fallbackData.termsAndConditions,
      };
    }
    return fallbackData;
  } catch (error) {
    console.warn('[Terms & Support Note] ir.config_parameter query fallback:', error);
    return fallbackData;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Delivery Order Validation & Address Verification APIs
// Postman: "Sale Minimum Order validation 149 RS", "Fetch customer Exsisting delivery address", "SELECT & VERIFY DELIVERY ADDRESS ON SALE ORDER"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates minimum order value (e.g. ₹149 minimum order) for a given sale order.
 * Endpoint: POST /api/delivery/order/validate_minimum
 */
export const validateSaleOrderMinimum = async (orderId: number | string): Promise<any> => {
  return callOdooCustomApi('/api/delivery/order/validate_minimum', {
    order_id: Number(orderId),
  });
};

/**
 * Fetches existing delivery address list for the current sale order.
 * Endpoint: POST /api/delivery/address/list
 */
export const fetchDeliveryAddressList = async (orderId: number | string): Promise<any> => {
  return callOdooCustomApi('/api/delivery/address/list', {
    order_id: Number(orderId),
  });
};

/**
 * Selects and verifies delivery address on the sale order.
 * Endpoint: POST /api/delivery/address/select_and_verify
 */
export const selectAndVerifyDeliveryAddress = async (
  orderId: number | string,
  addressId: number | string,
): Promise<any> => {
  return callOdooCustomApi('/api/delivery/address/select_and_verify', {
    order_id: Number(orderId),
    address_id: Number(addressId),
  });
};