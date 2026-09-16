// src/modules/profile/utils/addressMapper.ts
import { API_SETTINGS } from '../../../app/config';
import { AddressType, SavedAddress } from '../types/address';
import { CustomerAddressPayload } from '../services/customerService';

/**
 * Maps an Odoo `res.partner` record into a `SavedAddress` object.
 */
export const mapOdooPartnerToSavedAddress = (
  rawPartner: any,
  isDefault = false,
): SavedAddress => {
  if (!rawPartner) {
    return {
      id: '0',
      name: 'User',
      phone: '',
      pincode: API_SETTINGS.defaultPostalCode,
      flatNo: '',
      streetArea: '',
      city: API_SETTINGS.defaultCity,
      state: API_SETTINGS.defaultState,
      type: 'HOME',
      isDefault: false,
    };
  }

  const id = String(rawPartner.id ?? '');
  const name = String(rawPartner.name ?? 'My Address');
  const phone = String(rawPartner.phone || rawPartner.mobile || '');
  const pincode = String(rawPartner.zip || API_SETTINGS.defaultPostalCode);
  const city = String(rawPartner.city || API_SETTINGS.defaultCity);

  let state = API_SETTINGS.defaultState;
  if (Array.isArray(rawPartner.state_id) && rawPartner.state_id[1]) {
    state = String(rawPartner.state_id[1]);
  } else if (typeof rawPartner.state === 'string') {
    state = rawPartner.state;
  }

  const flatNo = String(rawPartner.street || '');
  const streetArea = String(rawPartner.street2 || rawPartner.city || '');
  const landmark = rawPartner.landmark || undefined;

  let type: AddressType = 'HOME';
  const nameLower = name.toLowerCase();
  if (nameLower.includes('work') || nameLower.includes('office')) {
    type = 'WORK';
  } else if (rawPartner.type === 'other') {
    type = 'OTHER';
  }

  return {
    id,
    name,
    phone,
    pincode,
    flatNo,
    streetArea,
    landmark,
    city,
    state,
    type,
    isDefault: Boolean(isDefault || rawPartner.is_default || rawPartner.type === 'contact'),
  };
};

/**
 * Converts a `SavedAddress` or partial address into a `CustomerAddressPayload` for Odoo API.
 */
export const mapSavedAddressToOdooPayload = (
  addr: Partial<SavedAddress>,
): CustomerAddressPayload => {
  return {
    name: addr.name || 'Delivery Address',
    phone: addr.phone,
    mobile: addr.phone,
    street: addr.flatNo || addr.streetArea || '',
    street2: addr.streetArea || addr.landmark || undefined,
    city: addr.city || API_SETTINGS.defaultCity,
    zip: addr.pincode || API_SETTINGS.defaultPostalCode,
    type: 'delivery',
  };
};
