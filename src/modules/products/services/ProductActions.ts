// src/modules/products/services/ProductActions.ts
import { axiosInstance } from '../../../app';

/** Fetch all active products (limited) */
export const getAllProducts = async (): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'home_delivery',
            2,
            '1234',
            'product.template',
            'search_read',
            [[['active', '=', true]]],
            {
              fields: [
                'id',
                'name',
                'display_name',
                'standard_price',
                'qty_available',
                'virtual_available',
                'categ_id',
                'description_sale',
                'image_1920',
                'image_512',
                'product_variant_ids',
                'currency_id',
                'list_price',
                'discount_percentage',
                'discounted_price',
                'uom_id',
              ],
              limit: 10,
            },
          ],
        },
        id: 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

/** Fetch products for a specific category */
export const getProductsByCategory = async (categoryId: string | number): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'home_delivery',
            2,
            '1234',
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
                'lb_rating_avg',
                'lb_review_count',
                'product_tag_ids',
              ],
              limit: 0,
            },
          ],
        },
        id: 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    throw error;
  }
};

/** Search products by name */
export const searchProducts = async (query: string): Promise<any> => {
  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'home_delivery',
            2,
            '1234',
            'product.template',
            'search_read',
            [
              [
                ['name', 'ilike', query],
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
                'image_512',
              ],
              limit: 20,
            },
          ],
        },
        id: 2,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in searchProducts:', error);
    throw error;
  }
};
