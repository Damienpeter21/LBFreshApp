import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../modules/home';
import { OrderDetailsScreen, OrdersScreen } from '../modules/orders';
import {
  CartScreen,
  CategoriesScreen,
  CheckoutScreen,
  PaymentScreen,
  ProductDetailsScreen,
  ProductListScreen,
  WishlistScreen,
} from '../modules/products';
import {
  AddressFormScreen,
  AddressListScreen,
  EditProfileScreen,
  NotificationsScreen,
  ProfileScreen,
} from '../modules/profile';
import { SplashScreen } from '../modules/splash';
import { LocationPickerModal } from '../modules/location';
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
              onNavigateToCategories={() =>
                props.navigation.navigate('Categories')
              }
              onNavigateToCart={() => props.navigation.navigate('Cart')}
              onNavigateToProfile={() => props.navigation.navigate('Profile')}
              onRequireAuth={() =>
                props.navigation.navigate('Auth', { screen: 'Login' })
              }
            />
          )}
        </RootStack.Screen>

        {/* 1.2 Dedicated All Categories Screen */}
        <RootStack.Screen name="Categories">
          {(props: RootScreenProps<'Categories'>) => (
            <CategoriesScreen
              initialCategories={props.route.params?.categories}
              onBack={() => props.navigation.goBack()}
              onSelectCategory={(categoryId, categoryName) =>
                props.navigation.navigate('ProductList', {
                  categoryId,
                  categoryName,
                })
              }
              onNavigateToCart={() => props.navigation.navigate('Cart')}
            />
          )}
        </RootStack.Screen>

        {/* 1.5 Dedicated Product Listing Screen with Filters */}
        <RootStack.Screen name="ProductList">
          {(props: RootScreenProps<'ProductList'>) => (
            <ProductListScreen
              initialCategoryId={props.route.params?.categoryId}
              initialCategoryName={props.route.params?.categoryName}
              initialSearchQuery={props.route.params?.searchQuery}
              products={props.route.params?.products}
              categories={props.route.params?.categories}
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
              onNavigateToCheckout={() => props.navigation.navigate('Checkout')}
              onRequireAuthForCheckout={() =>
                props.navigation.navigate('Auth', {
                  screen: 'Login',
                  params: { redirectTo: 'Cart' },
                })
              }
            />
          )}
        </RootStack.Screen>

        {/* 3.2 Checkout Screen */}
        <RootStack.Screen name="Checkout">
          {(props: RootScreenProps<'Checkout'>) => (
            <CheckoutScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToAddresses={() =>
                props.navigation.navigate('AddressList')
              }
              onNavigateToAddAddress={() =>
                props.navigation.navigate('AddressForm')
              }
              onNavigateToEditAddress={address =>
                props.navigation.navigate('AddressForm', {
                  addressToEdit: address,
                })
              }
              onNavigateToPayment={params =>
                props.navigation.navigate('Payment', params)
              }
            />
          )}
        </RootStack.Screen>

        {/* 3.4 Payment Screen */}
        <RootStack.Screen name="Payment">
          {(props: RootScreenProps<'Payment'>) => (
            <PaymentScreen
              totalAmount={props.route.params.totalAmount}
              subtotal={props.route.params.subtotal}
              shippingFee={props.route.params.shippingFee}
              carrierId={props.route.params.carrierId}
              discount={props.route.params.discount}
              couponCode={props.route.params.couponCode}
              onBack={() => props.navigation.goBack()}
              onOrderSuccess={() => {
                props.navigation.replace('Orders');
              }}
              onNavigateToShop={() => props.navigation.navigate('Home')}
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
              onNavigateToEditProfile={() =>
                props.navigation.navigate('EditProfile')
              }
              onNavigateToNotifications={() =>
                props.navigation.navigate('Notifications')
              }
            />
          )}
        </RootStack.Screen>

        {/* 4.2 Edit Profile Screen */}
        <RootStack.Screen name="EditProfile">
          {(props: RootScreenProps<'EditProfile'>) => (
            <EditProfileScreen
              onBack={() => props.navigation.goBack()}
            />
          )}
        </RootStack.Screen>

        {/* 4.4 Notifications Screen */}
        <RootStack.Screen name="Notifications">
          {(props: RootScreenProps<'Notifications'>) => (
            <NotificationsScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToOrders={() => props.navigation.navigate('Orders')}
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
      <LocationPickerModal />
    </NavigationContainer>
  );
};
