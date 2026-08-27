/**
 * Google Mobile Services Settings (Google Maps & Google OAuth)
 */

export interface GoogleConfig {
  /** Google Maps & Geocoding API Key (Android / iOS) */
  mapsApiKey: string;
  /** Google Maps Reverse Geocoding API Base URL */
  geocodingBaseUrl: string;
  /** Google OAuth Client ID for Android package (com.lbfreshapp) */
  androidClientId: string;
  /** Google OAuth Client ID for iOS bundle identifier */
  iosClientId: string;
  /** Requested OAuth permissions */
  scopes: string[];
}

export const GOOGLE_SETTINGS: GoogleConfig = {
  // Google Maps SDK & Geocoding API Key
  mapsApiKey: 'AIzaSyCFsDK03jS0TudB2iz1F07_LaQP8ygcCLs',
  geocodingBaseUrl: 'https://maps.googleapis.com/maps/api/geocode/json',

  // Native Mobile OAuth Client IDs
  androidClientId: '123456789012-android-lbfresh-clientid.apps.googleusercontent.com',
  iosClientId: '123456789012-ios-lbfresh-clientid.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
};

export default GOOGLE_SETTINGS;
