import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../modules/home';
import { OrderDetailsScreen, OrdersScreen } from '../modules/orders';
import {
  CartScreen,
  ProductDetailsScreen,
  ProductListScreen,
  WishlistScreen,
} from '../modules/products';
import {
  AddressFormScreen,
  AddressListScreen,
  ProfileScreen,
} from '../modules/profile';
import { SplashScreen } from '../modules/splash';
import { AuthNavigator } from './AuthNavigator';
import { RootScreenProps, RootStackParamList } from './types';

const RootStack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* 0. Brand Splash Screen */}
        <RootStack.Screen name="Splash">
          {(props: RootScreenProps<'Splash'>) => (
            <SplashScreen
              onFinish={() => props.navigation.replace('Home')}
            />
          )}
        </RootStack.Screen>

        {/* 1. Guest-First Home Screen */}
        <RootStack.Screen name="Home">
          {(props: RootScreenProps<'Home'>) => (
            <HomeScreen
              onNavigateToProductDetails={product =>
                props.navigation.navigate('ProductDetails', { product })
              }
              onNavigateToProductList={params =>
                props.navigation.navigate('ProductList', params)
              }
              onNavigateToCart={() => props.navigation.navigate('Cart')}
              onNavigateToProfile={() => props.navigation.navigate('Profile')}
              onRequireAuth={() =>
                props.navigation.navigate('Auth', { screen: 'Login' })
              }
            />
          )}
        </RootStack.Screen>

        {/* 1.5 Dedicated Product Listing Screen with Filters */}
        <RootStack.Screen name="ProductList">
          {(props: RootScreenProps<'ProductList'>) => (
            <ProductListScreen
              initialCategoryId={props.route.params?.categoryId}
              initialSearchQuery={props.route.params?.searchQuery}
              onBack={() => props.navigation.goBack()}
              onNavigateToProductDetails={product =>
                props.navigation.navigate('ProductDetails', { product })
              }
              onNavigateToCart={() => props.navigation.navigate('Cart')}
              onRequireAuth={() =>
                props.navigation.navigate('Auth', { screen: 'Login' })
              }
            />
          )}
        </RootStack.Screen>

        {/* 2. Product Details Screen */}
        <RootStack.Screen name="ProductDetails">
          {(props: RootScreenProps<'ProductDetails'>) => (
            <ProductDetailsScreen
              product={props.route.params.product}
              onBack={() => props.navigation.goBack()}
              onNavigateToCart={() => props.navigation.navigate('Cart')}
              onRequireAuthForCheckout={() =>
                props.navigation.navigate('Auth', {
                  screen: 'Login',
                  params: { redirectTo: 'Cart' },
                })
              }
            />
          )}
        </RootStack.Screen>

        {/* 3. Cart Screen */}
        <RootStack.Screen name="Cart">
          {(props: RootScreenProps<'Cart'>) => (
            <CartScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToShop={() => props.navigation.navigate('Home')}
              onRequireAuthForCheckout={() =>
                props.navigation.navigate('Auth', {
                  screen: 'Login',
                  params: { redirectTo: 'Cart' },
                })
              }
            />
          )}
        </RootStack.Screen>

        {/* 4. Profile Screen */}
        <RootStack.Screen name="Profile">
          {(props: RootScreenProps<'Profile'>) => (
            <ProfileScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToLogin={() =>
                props.navigation.navigate('Auth', { screen: 'Login' })
              }
              onNavigateToOrders={() => props.navigation.navigate('Orders')}
              onNavigateToSavedAddresses={() =>
                props.navigation.navigate('AddressList')
              }
              onNavigateToWishlist={() => props.navigation.navigate('Wishlist')}
            />
          )}
        </RootStack.Screen>

        {/* 4.5 Wishlist Screen */}
        <RootStack.Screen name="Wishlist">
          {(props: RootScreenProps<'Wishlist'>) => (
            <WishlistScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToProductDetails={product =>
                props.navigation.navigate('ProductDetails', { product })
              }
              onNavigateToShop={() => props.navigation.navigate('Home')}
              onNavigateToCart={() => props.navigation.navigate('Cart')}
            />
          )}
        </RootStack.Screen>

        {/* 5. Flipkart-Style Saved Addresses List Screen */}
        <RootStack.Screen name="AddressList">
          {(props: RootScreenProps<'AddressList'>) => (
            <AddressListScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToAddAddress={() =>
                props.navigation.navigate('AddressForm')
              }
              onNavigateToEditAddress={address =>
                props.navigation.navigate('AddressForm', {
                  addressToEdit: address,
                })
              }
              onSelectAndReturn={() => props.navigation.goBack()}
            />
          )}
        </RootStack.Screen>

        {/* 5.5 Delivery Address Form Screen (Add / Edit with Map Canvas) */}
        <RootStack.Screen name="AddressForm">
          {(props: RootScreenProps<'AddressForm'>) => (
            <AddressFormScreen
              addressToEdit={props.route.params?.addressToEdit}
              onBack={() => props.navigation.goBack()}
              onAddressSaved={() => props.navigation.goBack()}
            />
          )}
        </RootStack.Screen>

        {/* 6. Orders Screen (Live Tracking & History) */}
        <RootStack.Screen name="Orders">
          {(props: RootScreenProps<'Orders'>) => (
            <OrdersScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToShop={() => props.navigation.navigate('Home')}
              onNavigateToOrderDetails={order =>
                props.navigation.navigate('OrderDetails', { order })
              }
            />
          )}
        </RootStack.Screen>

        {/* 6.5 Full Order Details Screen */}
        <RootStack.Screen name="OrderDetails">
          {(props: RootScreenProps<'OrderDetails'>) => (
            <OrderDetailsScreen
              order={props.route.params.order}
              onBack={() => props.navigation.goBack()}
            />
          )}
        </RootStack.Screen>

        {/* 7. Auth Stack (Modal / Screen) */}
        <RootStack.Screen
          name="Auth"
          options={{
            presentation: 'modal',
          }}
        >
          {(props: RootScreenProps<'Auth'>) => (
            <AuthNavigator
              onClose={() => props.navigation.goBack()}
              onFinishAuth={(redirectTo?: string) => {
                if (redirectTo === 'Cart') {
                  props.navigation.navigate('Cart');
                } else {
                  props.navigation.goBack();
                }
              }}
            />
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
