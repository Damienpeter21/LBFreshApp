import React from 'react';
import { Modal, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/modules/location';
import { AuthProvider } from './src/modules/auth';
import { CartProvider, WishlistProvider } from './src/modules/products';
import { AddressProvider } from './src/modules/profile';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { StatusModalProvider, AppToastContainer, NoInternetScreen } from './src/components';
import { useNetworkStatus } from './src/app/utils/NetworkHelper';

function AppContent(): React.JSX.Element {
  const { isDark } = useTheme();
  const network = useNetworkStatus();

  // Display NoInternetScreen across the entire application whenever device is offline
  const isOffline = !network.isConnected || network.isInternetReachable === false;

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      <AppToastContainer />

      {/* Global No-Internet Barrier Modal */}
      <Modal
        visible={isOffline}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => {
          network.refresh();
        }}
      >
        <NoInternetScreen onRetry={network.refresh} isOverlay={true} />
      </Modal>
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
