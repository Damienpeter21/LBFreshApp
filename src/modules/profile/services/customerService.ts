// src/modules/profile/services/customerService.ts
import { callOdooRpc, ODOO_CONFIG } from '../../../app/config';

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
  isCompany?: boolean;
}

export class CustomerService {
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

    return callOdooRpc(
      'res.partner',
      'search_read',
      [
        [
          '|',
          '&', ['id', '=', pid], ['type', 'in', ['contact', 'delivery']],
          '&', ['parent_id', '=', pid], ['type', '=', 'delivery'],
        ],
      ],
      {
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
      },
    );
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

    return callOdooRpc(
      'res.partner',
      'create',
      [
        {
          parent_id: pid,
          type: payload.type || 'delivery',
          name: payload.name,
          street: payload.street,
          ...(payload.street2 ? { street2: payload.street2 } : {}),
          city: payload.city,
          zip: payload.zip,
          ...(payload.phone ? { phone: payload.phone } : {}),
          ...(payload.mobile ? { mobile: payload.mobile } : {}),
        },
      ],
    );
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

    return callOdooRpc(
      'res.partner',
      'write',
      [[Number(addressId)], updateData],
    );
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
