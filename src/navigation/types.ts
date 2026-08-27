import { StackScreenProps } from '@react-navigation/stack';
import { Order } from '../modules/orders/types';
import { Product } from '../modules/products/types/product';
import { SavedAddress } from '../modules/profile/types/address';

export type AuthStackParamList = {
  Login: { redirectTo?: keyof RootStackParamList } | undefined;
  Register: { redirectTo?: keyof RootStackParamList } | undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ProductList: { categoryId?: string; categoryName?: string; searchQuery?: string } | undefined;
  ProductDetails: { product: Product };
  Cart: undefined;
  Profile: undefined;
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
