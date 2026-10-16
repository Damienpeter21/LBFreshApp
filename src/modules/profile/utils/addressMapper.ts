// src/modules/profile/utils/addressMapper.ts
import { API_SETTINGS } from '../../../app/config';
import { AddressType, SavedAddress } from '../types/address';
import { CustomerAddressPayload } from '../services/customerService';

/**
 * Checks whether an Odoo partner record contains a genuine delivery street address.
 * Bare customer contact profiles (with no street/flat address) are not delivery addresses.
 */
export const isRealDeliveryAddress = (rawPartner: any): boolean => {
  if (!rawPartner) return false;
  const flatNo = String(rawPartner.street || '').trim();
  const streetArea = String(rawPartner.street2 || '').trim();
  return Boolean(flatNo || streetArea);
};

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
      pincode: '',
      flatNo: '',
      streetArea: '',
      city: '',
      state: '',
      type: 'HOME',
      isDefault: false,
    };
  }

  const id = String(rawPartner.id || rawPartner.address_id || rawPartner.partner_id || '');
  const name = String(rawPartner.name || rawPartner.contact_name || 'My Address');
  const phone = String(rawPartner.phone || rawPartner.mobile || '');
  const flatNo = String(rawPartner.street || rawPartner.house_no || rawPartner.flat_no || '').trim();
  const streetArea = String(rawPartner.street2 || rawPartner.area || rawPartner.locality || '').trim();
  const landmark = rawPartner.landmark || undefined;
  const city = String(rawPartner.city || '');
  const pincode = String(rawPartner.zip || rawPartner.pincode || rawPartner.postal_code || '');

  let state = '';
  let stateId: number | undefined;
  if (Array.isArray(rawPartner.state_id) && rawPartner.state_id.length > 0) {
    stateId = Number(rawPartner.state_id[0]) || undefined;
    state = String(rawPartner.state_id[1] || '');
  } else if (typeof rawPartner.state_id === 'number') {
    stateId = rawPartner.state_id;
  } else if (typeof rawPartner.state === 'string') {
    state = rawPartner.state;
  }

  let country = '';
  let countryId: number | undefined;
  if (Array.isArray(rawPartner.country_id) && rawPartner.country_id.length > 0) {
    countryId = Number(rawPartner.country_id[0]) || undefined;
    country = String(rawPartner.country_id[1] || '');
  } else if (typeof rawPartner.country_id === 'number') {
    countryId = rawPartner.country_id;
  } else if (typeof rawPartner.country === 'string') {
    country = rawPartner.country;
  }

  const isVerified = Boolean(
    rawPartner.is_verified ||
    rawPartner.verified ||
    rawPartner.is_deliverable ||
    rawPartner.delivery_verified ||
    rawPartner.state === 'verified',
  );

  const parseCoord = (val: any): number | undefined => {
    if (val !== undefined && val !== null && val !== false && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num !== 0) return num;
    }
    return undefined;
  };

  const latitude = parseCoord(rawPartner.latitude) ?? parseCoord(rawPartner.partner_latitude);
  const longitude = parseCoord(rawPartner.longitude) ?? parseCoord(rawPartner.partner_longitude);

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
    stateId,
    country,
    countryId,
    type,
    isDefault: Boolean(isDefault || rawPartner.is_default),
    isVerified,
    latitude,
    longitude,
  };
};

/**
 * Converts a `SavedAddress` or partial address into a `CustomerAddressPayload` for Odoo API.
 */
export const mapSavedAddressToOdooPayload = (
  addr: Partial<SavedAddress>,
): CustomerAddressPayload => {
  const lat = addr.latitude !== undefined && addr.latitude !== null && !isNaN(Number(addr.latitude))
    ? String(addr.latitude)
    : undefined;
  const lon = addr.longitude !== undefined && addr.longitude !== null && !isNaN(Number(addr.longitude))
    ? String(addr.longitude)
    : undefined;

  return {
    name: addr.name || 'Delivery Address',
    phone: addr.phone,
    mobile: addr.phone,
    street: addr.flatNo || addr.streetArea || '',
    street2: addr.streetArea || addr.landmark || undefined,
    city: addr.city || API_SETTINGS.defaultCity,
    zip: addr.pincode || API_SETTINGS.defaultPostalCode,
    type: 'delivery',
    latitude: lat,
    longitude: lon,
    stateId: addr.stateId,
    state_id: addr.stateId,
    countryId: addr.countryId,
    country_id: addr.countryId,
  };
};
