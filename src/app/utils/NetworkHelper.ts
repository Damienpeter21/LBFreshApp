import { useEffect, useState } from 'react';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
  NetInfoStateType,
} from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: NetInfoStateType;
  isWifi: boolean;
  isCellular: boolean;
}

/**
 * NetworkHelper
 * Utility class providing static network verification and subscription helpers using @react-native-community/netinfo
 */
export class NetworkHelper {
  /**
   * Checks whether the device is currently connected to the internet.
   */
  static async isInternetConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return Boolean(state.isConnected && (state.isInternetReachable ?? true));
    } catch {
      return false;
    }
  }

  /**
   * Fetches full network details snapshot.
   */
  static async getNetworkState(): Promise<NetInfoState> {
    return NetInfo.fetch();
  }

  /**
   * Subscribes to real-time network state changes.
   * Returns an unsubscribe function.
   */
  static addEventListener(
    listener: (status: NetworkStatus) => void
  ): NetInfoSubscription {
    return NetInfo.addEventListener(state => {
      listener({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });
  }
}

/**
 * React Hook for real-time network connectivity tracking
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: NetInfoStateType.other,
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    // Initial fetch
    NetworkHelper.getNetworkState().then(state => {
      setNetworkStatus({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        isWifi: state.type === NetInfoStateType.wifi,
        isCellular: state.type === NetInfoStateType.cellular,
      });
    });

    // Subscribe to listener
    const unsubscribe = NetworkHelper.addEventListener(setNetworkStatus);
    return () => unsubscribe();
  }, []);

  return networkStatus;
};

export default NetworkHelper;
