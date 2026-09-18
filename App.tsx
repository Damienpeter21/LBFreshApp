import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/modules/location';
import { AuthProvider } from './src/modules/auth';
import { CartProvider, WishlistProvider } from './src/modules/products';
import { AddressProvider } from './src/modules/profile';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { StatusModalProvider } from './src/components';

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
        <StatusModalProvider>
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
        </StatusModalProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
