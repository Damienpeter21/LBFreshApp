// src/app/config/odooConfig.ts
import axiosInstance from './axios/AxiosInstance';

/**
 * Standard Odoo JSON-RPC & API Configuration Constants
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
export const ODOO_DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': ODOO_CONFIG.API_KEY,
};

let rpcCounter = 1;

/**
 * Executes a standard Odoo JSON-RPC `execute_kw` method call against `/jsonrpc`.
 *
 * @param model Odoo model name (e.g. 'sale.order', 'res.partner', 'product.template')
 * @param method Odoo ORM method (e.g. 'search_read', 'read', 'create', 'write', 'unlink', 'action_cancel')
 * @param args Positional arguments passed to the model method
 * @param kwargs Keyword arguments / options (e.g. fields, order, limit, offset)
 * @param auth Override DB, UID, or password if needed
 */
export async function callOdooRpc<T = any>(
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {},
  auth?: { db?: string; uid?: number | null; password?: string | null },
): Promise<T> {
  const db = auth?.db ?? ODOO_CONFIG.DB;
  const uid = auth?.uid !== undefined ? auth.uid : ODOO_CONFIG.UID;
  const password = auth?.password !== undefined ? auth.password : ODOO_CONFIG.PASSWORD;

  const rpcId = ++rpcCounter;

  try {
    const response = await axiosInstance({
      method: 'POST',
      url: '/jsonrpc',
      headers: ODOO_DEFAULT_HEADERS,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [db, uid, password, model, method, args, kwargs],
        },
        id: rpcId,
      },
    });

    if (response.data?.error) {
      const err = response.data.error;
      const message =
        err.data?.message ||
        err.message ||
        `Odoo RPC Error in ${model}.${method}`;
      console.warn(`[Odoo RPC Error] ${model}.${method}:`, message);
      throw new Error(message);
    }

    return response.data;
  } catch (error) {
    console.error(`Error in callOdooRpc (${model}.${method}):`, error);
    throw error;
  }
}

/**
 * Executes a custom Odoo API endpoint (e.g. `/api/products/top_selling`).
 */
export async function callOdooCustomApi<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T> {
  const rpcId = ++rpcCounter;

  try {
    const response = await axiosInstance({
      method: 'POST',
      url: endpoint,
      headers: ODOO_DEFAULT_HEADERS,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: ODOO_CONFIG.DB,
          login: ODOO_CONFIG.LOGIN,
          password: ODOO_CONFIG.PASSWORD,
          ...params,
        },
        id: rpcId,
      },
    });

    if (response.data?.error) {
      const err = response.data.error;
      const message =
        err.data?.message ||
        err.message ||
        `Odoo Custom API Error at ${endpoint}`;
      console.warn(`[Odoo API Error] ${endpoint}:`, message);
      throw new Error(message);
    }

    return response.data;
  } catch (error) {
    console.error(`Error in callOdooCustomApi (${endpoint}):`, error);
    throw error;
  }
}
