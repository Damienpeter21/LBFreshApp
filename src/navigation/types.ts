import { StackScreenProps } from '@react-navigation/stack';
import { Product } from '../modules/products/types/product';

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
  Auth: { screen?: keyof AuthStackParamList; params?: any } | undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;
