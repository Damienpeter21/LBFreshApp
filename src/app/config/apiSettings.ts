/**
 * API & Backend Service Settings
 */

export interface ApiSettings {
  baseUrl: string;
  timeoutMs: number;
  defaultDeliveryMinutes: number;
  freeDeliveryThreshold: number;
  defaultCity: string;
  defaultState: string;
  defaultPostalCode: string;
  razorPay: {
    key: string;
    secret: string;
  };
  defaultCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export const API_SETTINGS: ApiSettings = {
  baseUrl: 'https://lbfreshbasket.com',
  timeoutMs: 10000,
  defaultDeliveryMinutes: 15,
  freeDeliveryThreshold: 199,
  defaultCity: 'Chennai',
  defaultState: 'Tamil Nadu',
  defaultPostalCode: '600002',
  razorPay: {
    key: 'rzp_test_TdOd1GTjPH0OGI',
    secret: 'dna7Beelw4OqRNyRmnnK37FN',
  },
  defaultCoordinates: {
    latitude: 13.0827,
    longitude: 80.2707, // Official Center Point of Chennai (Anna Salai / Central)
  },
};

export default API_SETTINGS;
