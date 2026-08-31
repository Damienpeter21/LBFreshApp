import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/modules/location';
import { AuthProvider } from './src/modules/auth';
import { CartProvider, WishlistProvider } from './src/modules/products';
import { AddressProvider } from './src/modules/profile';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent(): React.JSX.Element {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <AddressProvider>
              <WishlistProvider>
                <CartProvider>
                  <AppContent />
                </CartProvider>
              </WishlistProvider>
            </AddressProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
