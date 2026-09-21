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
  googleMap: {
    key: string;
    secret: string;
  };
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
  timeoutMs: 25000,
  defaultDeliveryMinutes: 15,
  freeDeliveryThreshold: 199,
  defaultCity: 'Chennai',
  defaultState: 'Tamil Nadu',
  defaultPostalCode: '600002',
  googleMap: {
    key: 'AIzaSyCDt1wcypqjCsDLhTQWnJN2xpPHE4cXxHY',
    //key: 'AIzaSyDfNOU_zv2QAESamCNM8UM8M1FyAXXORZc',
    secret: '5O0USbwRw8L4mQJhLzi7Wh-Qmv4=',
  },
  razorPay: {
    key: 'rzp_test_TdOidiEvuXTPfe',
    secret: '2GB25f8Hi71gF7yYJGWuV25z',
  },
  defaultCoordinates: {
    latitude: 13.0827,
    longitude: 80.2707, // Official Center Point of Chennai (Anna Salai / Central)
  },
};

export default API_SETTINGS;
