import { API_SETTINGS, GOOGLE_SETTINGS } from '../../../app/config';
import { LocationCoordinates, UserLocation } from '../types';

/**
 * Reverse geocodes coordinates to human address using Google Maps Geocoding API.
 * Ensures the output is always 100% human-readable text without raw coordinates.
 */
export const reverseGeocodeCoordinates = async (
  coords: LocationCoordinates
): Promise<Partial<UserLocation>> => {
  const apiKey = (GOOGLE_SETTINGS.mapsApiKey || '').trim().replace(/\.+$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const googleUrl = `${GOOGLE_SETTINGS.geocodingBaseUrl}?latlng=${coords.latitude},${coords.longitude}&key=${apiKey}`;
    const response = await fetch(googleUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        let subLocality = '';
        let route = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let postalCode = '';

        result.address_components?.forEach((comp: any) => {
          const types: string[] = comp.types || [];
          if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            subLocality = comp.long_name;
          }
          if (types.includes('route')) {
            route = comp.long_name;
          }
          if (types.includes('neighborhood')) {
            neighborhood = comp.long_name;
          }
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = comp.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = comp.long_name;
          }
        });

        // Determine prominent area name
        const primaryArea = subLocality || neighborhood || route || 'Anna Salai';
        const finalCity = city || API_SETTINGS.defaultCity;
        const finalState = state || API_SETTINGS.defaultState;
        const finalPincode = postalCode || API_SETTINGS.defaultPostalCode;

        const shortAddress = `${primaryArea}, ${finalCity}`;
        const formattedAddress =
          result.formatted_address ||
          `${primaryArea}, ${finalCity}, ${finalState} - ${finalPincode}`;

        return {
          formattedAddress,
          shortAddress,
          subLocality: primaryArea,
          city: finalCity,
          state: finalState,
          postalCode: finalPincode,
          coordinates: coords,
        };
      }
    }
  } catch (err) {
    console.log('Google Maps geocoding request notice:', err);
  }

  // Human-readable fallback text without raw coordinates
  const fallbackArea = 'Anna Salai, Triplicane';
  const fallbackCity = API_SETTINGS.defaultCity;
  const fallbackState = API_SETTINGS.defaultState;
  const fallbackPin = API_SETTINGS.defaultPostalCode;

  return {
    formattedAddress: `${fallbackArea}, ${fallbackCity}, ${fallbackState} - ${fallbackPin}`,
    shortAddress: `${fallbackArea}, ${fallbackCity}`,
    subLocality: fallbackArea,
    city: fallbackCity,
    state: fallbackState,
    postalCode: fallbackPin,
    coordinates: coords,
  };
};

export default reverseGeocodeCoordinates;
