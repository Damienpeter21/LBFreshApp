/**
 * Application Navigation Route Constants
 * Standard type-safe route names following React Native enterprise architecture.
 */

export const APP_ROUTES = {
  SPLASH: 'Splash',
  HOME: 'Home',
  PRODUCT_LIST: 'ProductList',
  PRODUCT_DETAILS: 'ProductDetails',
  CART: 'Cart',
  PROFILE: 'Profile',
  WISHLIST: 'Wishlist',
  ADDRESS_LIST: 'AddressList',
  ADDRESS_FORM: 'AddressForm',
  ORDERS: 'Orders',
  ORDER_DETAILS: 'OrderDetails',
  AUTH: 'Auth',
} as const;

export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
} as const;

export type AppRouteName = typeof APP_ROUTES[keyof typeof APP_ROUTES];
export type AuthRouteName = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
