import { StackScreenProps } from '@react-navigation/stack';
import { Order } from '../modules/orders/types';
import { Category, Product } from '../modules/products/types/product';
import { SavedAddress } from '../modules/profile/types/address';

export type AuthStackParamList = {
  Login: { redirectTo?: keyof RootStackParamList } | undefined;
  Register: { redirectTo?: keyof RootStackParamList } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Categories: { categories?: Category[] } | undefined;
  ProductList:
    | {
        categoryId?: string;
        categoryName?: string;
        searchQuery?: string;
        products?: Product[];
        categories?: Category[];
      }
    | undefined;
  ProductDetails: { product: Product };
  Cart: undefined;
  Checkout: undefined;
  Payment: {
    orderPayload?: any;
    totalAmount: number;
    subtotal: number;
    shippingFee?: number;
    carrierId?: number;
    discount?: number;
    couponCode?: string;
  };
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Wishlist: undefined;
  AddressList: undefined;
  AddressForm: { addressToEdit?: SavedAddress; returnTo?: keyof RootStackParamList } | undefined;
  Orders: undefined;
  OrderDetails: { order: Order };
  Auth: { screen?: keyof AuthStackParamList; params?: any } | undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;
