// src/modules/profile/services/customerService.ts
import { callOdooRpc, callOdooCustomApi, ODOO_CONFIG } from '../../../app/config';

export interface CustomerAddressPayload {
  parentId?: number | string;
  type?: 'contact' | 'delivery' | 'invoice' | 'other';
  name: string;
  phone?: string;
  mobile?: string;
  street: string;
  street2?: string;
  city: string;
  zip: string;
  stateId?: number;
  countryId?: number;
  state_id?: number | string;
  country_id?: number | string;
  isCompany?: boolean;
  latitude?: number | string;
  longitude?: number | string;
  partner_latitude?: number | string;
  partner_longitude?: number | string;
}

export interface OdooCountry {
  id: number;
  name: string;
  code?: string;
}

export interface OdooState {
  id: number;
  name: string;
  code?: string;
  country_id?: [number, string] | number;
}

export class CustomerService {
  /**
   * Fetches list of countries from Odoo.
   * Model: res.country
   * Method: search_read
   * Fields: ['id', 'name', 'code']
   */
  static async getCountries(): Promise<OdooCountry[]> {
    try {
      const res = await callOdooRpc(
        'res.country',
        'search_read',
        [[]],
        {
          fields: ['id', 'name', 'code'],
          order: 'name asc',
        },
      );
      const list = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
      if (list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('[CustomerService.getCountries] error:', err);
    }
    return [{ id: 104, name: 'India', code: 'IN' }];
  }

  /**
   * Fetches list of states from Odoo.
   * Model: res.country.state
   * Method: search_read
   * Fields: ['id', 'name', 'code', 'country_id']
   */
  static async getStates(countryId?: number | string | null): Promise<OdooState[]> {
    try {
      const cId = countryId && !isNaN(Number(countryId)) ? Number(countryId) : null;
      const domain = cId ? [[['country_id', '=', cId]]] : [[]];

      const res = await callOdooRpc(
        'res.country.state',
        'search_read',
        domain,
        {
          fields: ['id', 'name', 'code', 'country_id'],
          order: 'name asc',
        },
      );
      const list = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
      if (list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('[CustomerService.getStates] error:', err);
    }
    return [
      { id: 607, name: 'Tamil Nadu', code: 'TN', country_id: 104 },
      { id: 598, name: 'Karnataka', code: 'KA', country_id: 104 },
      { id: 600, name: 'Kerala', code: 'KL', country_id: 104 },
      { id: 582, name: 'Andhra Pradesh', code: 'AP', country_id: 104 },
      { id: 610, name: 'Telangana', code: 'TS', country_id: 104 },
      { id: 602, name: 'Maharashtra', code: 'MH', country_id: 104 },
    ];
  }

  /**
   * Fetches customer existing delivery addresses.
   * Postman: "Fetch customer Exsisting delivery address"
   * Endpoint: /api/delivery/address/list
   */
  static async fetchDeliveryAddressList(
    orderId?: number | string | null,
    partnerId?: number | string | null,
  ): Promise<any> {
    try {
      const params: Record<string, any> = {};
      if (orderId && !isNaN(Number(orderId))) {
        params.order_id = Number(orderId);
      }
      if (partnerId && !isNaN(Number(partnerId))) {
        params.partner_id = Number(partnerId);
      }

      const res = await callOdooCustomApi('/api/delivery/address/list', params);
      const rawList = Array.isArray(res?.result)
        ? res.result
        : Array.isArray(res?.result?.addresses)
        ? res.result.addresses
        : Array.isArray(res?.result?.address_list)
        ? res.result.address_list
        : Array.isArray(res?.result?.delivery_addresses)
        ? res.result.delivery_addresses
        : [];

      if (rawList.length > 0) {
        return { result: rawList };
      }
    } catch (apiErr) {
      console.warn('/api/delivery/address/list API note, falling back to ORM:', apiErr);
    }

    // Fallback to standard ORM search_read
    return CustomerService.getCustomerAddresses(partnerId);
  }

  /**
   * Selects and verifies a delivery address on a sale order.
   * Postman: "SELECT & VERIFY DELIVERY ADDRESS ON SALE ORDER"
   * Endpoint: /api/delivery/address/select_and_verify
   */
  static async selectAndVerifyDeliveryAddress(
    orderId: number | string,
    addressId: number | string,
  ): Promise<any> {
    try {
      const res = await callOdooCustomApi('/api/delivery/address/select_and_verify', {
        order_id: Number(orderId),
        address_id: Number(addressId),
      });
      return res;
    } catch (apiErr) {
      console.warn('/api/delivery/address/select_and_verify note, falling back to write:', apiErr);
      return callOdooRpc(
        'sale.order',
        'write',
        [
          [Number(orderId)],
          {
            partner_shipping_id: Number(addressId),
            partner_invoice_id: Number(addressId),
          },
        ],
      );
    }
  }

  /**
   * Fetches customer addresses including main contact and delivery children.
   * Postman: "GET Customer Addresses" (Customer item 2) & "Multi Delivery address" (Customer item 8)
   */
  static async getCustomerAddresses(partnerId?: number | string | null): Promise<any> {
    if (!partnerId) {
      return { result: [] };
    }
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      return { result: [] };
    }

    const domain = [
      [
        '|',
        '&', ['id', '=', pid], ['type', 'in', ['contact', 'delivery']],
        '&', ['parent_id', '=', pid], ['type', '=', 'delivery'],
      ],
    ];

    const fieldsWithGeo = [
      'id',
      'name',
      'type',
      'street',
      'street2',
      'city',
      'state_id',
      'zip',
      'country_id',
      'phone',
      'mobile',
      'is_company',
      'contact_address_inline',
      'latitude',
      'longitude',
      'partner_latitude',
      'partner_longitude',
    ];

    try {
      return await callOdooRpc('res.partner', 'search_read', domain, { fields: fieldsWithGeo });
    } catch {
      try {
        return await callOdooRpc('res.partner', 'search_read', domain, {
          fields: [
            'id',
            'name',
            'type',
            'street',
            'street2',
            'city',
            'state_id',
            'zip',
            'country_id',
            'phone',
            'mobile',
            'is_company',
            'contact_address_inline',
            'latitude',
            'longitude',
          ],
        });
      } catch {
        return await callOdooRpc('res.partner', 'search_read', domain, {
          fields: [
            'id',
            'name',
            'type',
            'street',
            'street2',
            'city',
            'state_id',
            'zip',
            'country_id',
            'phone',
            'mobile',
            'is_company',
            'contact_address_inline',
          ],
        });
      }
    }
  }

  /**
   * Creates a new delivery address for the customer.
   * Postman: "POST Customer Address" (Customer item 3)
   */
  static async createCustomerAddress(
    partnerId: number | string | null | undefined,
    payload: CustomerAddressPayload,
  ): Promise<any> {
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) {
      throw new Error('Valid customer partner ID is required to save address');
    }

    const partnerData: Record<string, any> = {
      parent_id: pid,
      type: payload.type || 'delivery',
      name: payload.name,
      street: payload.street,
      ...(payload.street2 ? { street2: payload.street2 } : {}),
      city: payload.city,
      zip: payload.zip,
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.mobile ? { mobile: payload.mobile } : {}),
    };

    if (payload.latitude !== undefined && payload.latitude !== null && !isNaN(Number(payload.latitude))) {
      partnerData.latitude = String(payload.latitude);
    }
    if (payload.longitude !== undefined && payload.longitude !== null && !isNaN(Number(payload.longitude))) {
      partnerData.longitude = String(payload.longitude);
    }

    const cId = payload.country_id ?? payload.countryId;
    if (cId !== undefined && cId !== null && cId !== '') {
      const numCId = Number(cId);
      partnerData.country_id = !isNaN(numCId) ? numCId : cId;
    }

    const sId = payload.state_id ?? payload.stateId;
    if (sId !== undefined && sId !== null && sId !== '') {
      const numSId = Number(sId);
      partnerData.state_id = !isNaN(numSId) ? numSId : sId;
    }

    try {
      return await callOdooRpc('res.partner', 'create', [partnerData]);
    } catch (rpcErr: any) {
      const errStr = String(rpcErr?.message || rpcErr || '');
      // Fallback if backend model expects float or partner_latitude
      if (errStr.includes('latitude') || errStr.includes('longitude')) {
        const fallbackData = { ...partnerData };
        if (payload.latitude !== undefined) fallbackData.latitude = Number(payload.latitude);
        if (payload.longitude !== undefined) fallbackData.longitude = Number(payload.longitude);
        try {
          return await callOdooRpc('res.partner', 'create', [fallbackData]);
        } catch {
          delete fallbackData.latitude;
          delete fallbackData.longitude;
          if (payload.latitude !== undefined) fallbackData.partner_latitude = Number(payload.latitude);
          if (payload.longitude !== undefined) fallbackData.partner_longitude = Number(payload.longitude);
          try {
            return await callOdooRpc('res.partner', 'create', [fallbackData]);
          } catch {
            delete fallbackData.partner_latitude;
            delete fallbackData.partner_longitude;
            return await callOdooRpc('res.partner', 'create', [fallbackData]);
          }
        }
      }
      throw rpcErr;
    }
  }

  /**
   * Updates an existing customer address.
   * Postman: "PUT Customer Address" (Customer item 4)
   */
  static async updateCustomerAddress(
    addressId: number | string,
    payload: Partial<CustomerAddressPayload>,
  ): Promise<any> {
    const updateData: Record<string, any> = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.street) updateData.street = payload.street;
    if (payload.street2 !== undefined) updateData.street2 = payload.street2;
    if (payload.city) updateData.city = payload.city;
    if (payload.zip) updateData.zip = payload.zip;
    if (payload.phone) updateData.phone = payload.phone;
    if (payload.mobile) updateData.mobile = payload.mobile;
    if (payload.type) updateData.type = payload.type;

    if (payload.latitude !== undefined && payload.latitude !== null && !isNaN(Number(payload.latitude))) {
      updateData.latitude = String(payload.latitude);
    }
    if (payload.longitude !== undefined && payload.longitude !== null && !isNaN(Number(payload.longitude))) {
      updateData.longitude = String(payload.longitude);
    }

    const cId = payload.country_id ?? payload.countryId;
    if (cId !== undefined && cId !== null && cId !== '') {
      const numCId = Number(cId);
      updateData.country_id = !isNaN(numCId) ? numCId : cId;
    }

    const sId = payload.state_id ?? payload.stateId;
    if (sId !== undefined && sId !== null && sId !== '') {
      const numSId = Number(sId);
      updateData.state_id = !isNaN(numSId) ? numSId : sId;
    }

    try {
      return await callOdooRpc(
        'res.partner',
        'write',
        [[Number(addressId)], updateData],
      );
    } catch (rpcErr: any) {
      const errStr = String(rpcErr?.message || rpcErr || '');
      if (errStr.includes('latitude') || errStr.includes('longitude')) {
        const fallbackData = { ...updateData };
        if (payload.latitude !== undefined) fallbackData.latitude = Number(payload.latitude);
        if (payload.longitude !== undefined) fallbackData.longitude = Number(payload.longitude);
        try {
          return await callOdooRpc(
            'res.partner',
            'write',
            [[Number(addressId)], fallbackData],
          );
        } catch {
          delete fallbackData.latitude;
          delete fallbackData.longitude;
          if (payload.latitude !== undefined) fallbackData.partner_latitude = Number(payload.latitude);
          if (payload.longitude !== undefined) fallbackData.partner_longitude = Number(payload.longitude);
          try {
            return await callOdooRpc(
              'res.partner',
              'write',
              [[Number(addressId)], fallbackData],
            );
          } catch {
            delete fallbackData.partner_latitude;
            delete fallbackData.partner_longitude;
            return await callOdooRpc(
              'res.partner',
              'write',
              [[Number(addressId)], fallbackData],
            );
          }
        }
      }
      throw rpcErr;
    }
  }

  /**
   * Deletes a customer address.
   * Postman: "DELETE Customer Address" (Customer item 6)
   */
  static async deleteCustomerAddress(addressId: number | string): Promise<any> {
    return callOdooRpc('res.partner', 'unlink', [[Number(addressId)]]);
  }

  /**
   * Sets default child delivery address on the main partner.
   * Postman: "POST Set Default Address" (Customer item 5)
   */
  static async setDefaultAddress(
    partnerId: number | string | null | undefined,
    addressPayload: CustomerAddressPayload,
  ): Promise<any> {
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) return;

    return callOdooRpc(
      'res.partner',
      'write',
      [
        [pid],
        {
          child_ids: [
            [
              0,
              0,
              {
                type: 'delivery',
                name: addressPayload.name,
                street: addressPayload.street,
                city: addressPayload.city,
                zip: addressPayload.zip,
                phone: addressPayload.phone,
              },
            ],
          ],
        },
      ],
    );
  }

  /**
   * Updates customer profile details on res.partner.
   * Postman: "PUT Update Customer" (Customer item 1)
   */
  static async updateCustomerProfile(
    partnerId: number | string,
    data: { name?: string; email?: string; phone?: string },
  ): Promise<any> {
    const pid = Number(partnerId);
    if (!pid || isNaN(pid)) return;
    return callOdooRpc('res.partner', 'write', [[pid], data]);
  }

  /**
   * Fetches user profile from res.users.
   * Postman: "GET My Profile" (Authentication item 5)
   */
  static async getUserProfile(userId: number | string): Promise<any> {
    const uid = Number(userId || ODOO_CONFIG.UID);
    return callOdooRpc(
      'res.users',
      'search_read',
      [[['id', '=', uid]]],
      {
        fields: [
          'id',
          'name',
          'login',
          'email',
          'partner_id',
          'phone',
          'company_id',
          'company_ids',
        ],
        limit: 1,
      },
    );
  }

  /**
   * Updates user profile in res.users.
   * Postman: "PUT My Profile" (Authentication item 7)
   */
  static async updateUserProfile(
    userId: number | string,
    data: { name?: string; phone?: string },
  ): Promise<any> {
    const uid = Number(userId || ODOO_CONFIG.UID);
    return callOdooRpc('res.users', 'write', [[uid], data]);
  }
}
