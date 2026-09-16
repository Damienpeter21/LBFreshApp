// src/modules/home/services/HomeActions.ts
import { axiosInstance } from '../../../app';

/**
 * Standard Odoo JSON-RPC and API Configuration Constants
 * Matches the official Postman collection for LBFreshBasket
 */
export const ODOO_CONFIG = {
  DB: 'home_delivery',
  UID: 2,
  PASSWORD: '1234',
  LOGIN: 'inbaagnes@gmail.com',
  API_KEY: 'f0cdb9807be1d3368fa9b949004ada4e02fca716',
};

/** Default headers for Odoo API endpoints */
const defaultHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': ODOO_CONFIG.API_KEY,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home Promotional Banners (Loyalty Programs)
// Postman: "Banner" (item 15) & "Loyalty Program" (item 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches promotional banners from active loyalty programs.
 * Method: POST to /jsonrpc
 */
export const homeBanner = async (limit = 50): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'trigger',
                'trigger_product_ids',
                'reward_ids',
                'rule_ids',
              ],
              order: 'sequence asc',
              limit,
            },
          ],
        },
        id: 101,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in homeBanner:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Product Categories
// Postman: "All Product Category" (item 6)
// Fixed: Method changed from GET to POST, UID updated to 2, added "product_count"
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryQueryOptions {
  onlyWithProducts?: boolean;
  limit?: number;
}

/**
 * Fetches product categories.
 * Method: POST to /jsonrpc (Fixed: Was GET which is stripped by Android/OkHttp)
 * UID: 2 (Fixed: Was 6)
 * Fields: Includes product_count from Postman collection
 */
export const getProductCategoriesData = async (
  options?: CategoryQueryOptions,
): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
              ...(options?.limit ? { limit: options.limit } : {}),
            },
          ],
        },
        id: 3,
      },
    });

    // Optionally filter categories that have actual products and exclude internal categories
    if (options?.onlyWithProducts && Array.isArray(response.data?.result)) {
      const filtered = response.data.result.filter(
        (cat: any) =>
          Number(cat.product_count ?? 0) > 0 &&
          cat.name !== 'Expenses' &&
          cat.name !== 'Saleable' &&
          cat.name !== 'Deliveries' &&
          cat.name !== 'All',
      );
      return {
        ...response.data,
        result: filtered,
      };
    }

    return response.data;
  } catch (error) {
    console.error('Error in getProductCategoriesData:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Deals of the Day
// Postman: "Deals of the Day" (item 13)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches current deals of the day products.
 * Method: POST to /jsonrpc
 */
export const getDealoftheDay = async (limit = 50): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'lb_rating_avg',
                'lb_review_count',
              ],
              limit,
            },
          ],
        },
        id: 21,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getDealoftheDay:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. New Arrivals
// Postman: "All New Arraivals" (item 12)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches newly arrived products (website_ribbon_id = "New Arrivals").
 * Method: POST to /jsonrpc
 * Includes order by id desc and smart fallback if ribbon count is low.
 */
export const getNewArrival = async (limit = 80): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'lb_rating_avg',
                'lb_review_count',
                'website_ribbon_id',
                'website_published',
              ],
              order: 'id desc',
              limit,
            },
          ],
        },
        id: 20,
      },
    });

    // Fallback: If Ribbon returns fewer than 3 products, supplement with latest active products
    const ribbonProducts = response.data?.result;
    if (Array.isArray(ribbonProducts) && ribbonProducts.length < 3) {
      try {
        const fallbackRes = await axiosInstance({
          method: 'POST',
          url: '/jsonrpc',
          headers: defaultHeaders,
          data: {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              service: 'object',
              method: 'execute_kw',
              args: [
                ODOO_CONFIG.DB,
                ODOO_CONFIG.UID,
                ODOO_CONFIG.PASSWORD,
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
                    'lb_rating_avg',
                    'lb_review_count',
                  ],
                  order: 'id desc',
                  limit: Math.max(10, limit),
                },
              ],
            },
            id: 22,
          },
        });

        const fallbackProducts = fallbackRes.data?.result || [];
        const existingIds = new Set(ribbonProducts.map((p: any) => p.id));
        const merged = [
          ...ribbonProducts,
          ...fallbackProducts.filter((p: any) => !existingIds.has(p.id)),
        ].slice(0, limit);

        return {
          ...response.data,
          result: merged,
        };
      } catch (fallbackError) {
        console.warn('Fallback in getNewArrival failed:', fallbackError);
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error in getNewArrival:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Popular Products / Top Selling Products
// Postman: "Top Selling Products" (item 16)
// Fixed: Endpoint updated to /api/products/top_selling with proper params & normalized result
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches top selling / popular products.
 * Method: POST to /api/products/top_selling (Odoo custom Top Selling API)
 * Automatically normalizes response.data.result to an Array of products for UI compatibility.
 */
export const getPopularProducts = async (): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/api/products/top_selling',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: ODOO_CONFIG.DB,
          login: ODOO_CONFIG.LOGIN,
          password: ODOO_CONFIG.PASSWORD,
        },
        id: 1,
      },
    });

    const rawResult = response.data?.result;
    // /api/products/top_selling returns { status: 200, count: X, products: [...] }
    const products = Array.isArray(rawResult)
      ? rawResult
      : (Array.isArray(rawResult?.products) ? rawResult.products : []);

    // If top_selling returns products, normalize result to an array
    if (products.length > 0) {
      return {
        ...response.data,
        result: products,
      };
    }

    // Fallback if top_selling returned 0 products
    return await getPopularProductsFallback();
  } catch (error) {
    console.warn('Primary getPopularProducts (/api/products/top_selling) failed, using fallback:', error);
    return await getPopularProductsFallback();
  }
};

/**
 * Robust fallback for popular products if the dedicated top_selling route is unavailable.
 * Queries active products sorted by id desc.
 */
const getPopularProductsFallback = async (limit = 20): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'lb_rating_avg',
                'lb_review_count',
              ],
              order: 'id desc',
              limit,
            },
          ],
        },
        id: 25,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getPopularProductsFallback:', error);
    throw error;
  }
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
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'lb_rating_avg',
                'lb_review_count',
              ],
              limit,
            },
          ],
        },
        id: 11,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getDiscountedProducts:', error);
    throw error;
  }
};

/**
 * Fetches delivery time details for all products.
 * Postman: "Delivery Time all Products" (item 14)
 */
export const getDeliveryTimeProducts = async (limit = 50): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
          ],
        },
        id: 25,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getDeliveryTimeProducts:', error);
    throw error;
  }
};

/**
 * Fetches product availability (in stock products from product.product).
 * Postman: "GET Product Availability" (item 4)
 */
export const getProductAvailability = async (limit = 20): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
          ],
        },
        id: 4,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getProductAvailability:', error);
    throw error;
  }
};

/**
 * Fetches products filtered specifically by category ID.
 * Postman: "Products Category Wise" (item 5)
 */
export const getProductsCategoryWise = async (
  categoryId: number | string,
  limit = 20,
): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
                'lb_rating_avg',
                'lb_review_count',
              ],
              limit,
            },
          ],
        },
        id: 3,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getProductsCategoryWise:', error);
    throw error;
  }
};

/** Alias for getProductsCategoryWise */
export const getProductsByCategory = getProductsCategoryWise;

/**
 * Fetches active promotion loyalty programs.
 * Postman: "Loyalty Program" (item 7)
 */
export const getLoyaltyPrograms = async (limit = 10): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: defaultHeaders,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_CONFIG.DB,
            ODOO_CONFIG.UID,
            ODOO_CONFIG.PASSWORD,
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
          ],
        },
        id: 6,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in getLoyaltyPrograms:', error);
    throw error;
  }
};