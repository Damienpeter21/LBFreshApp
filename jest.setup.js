// jest.setup.js
/* eslint-disable no-undef */

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: {
        latitude: 13.0827,
        longitude: 80.2707,
        altitude: 0,
        accuracy: 10,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

const mockStorage = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((k, v) => {
    mockStorage[k] = v;
    return Promise.resolve(null);
  }),
  getItem: jest.fn((k) => Promise.resolve(mockStorage[k] || null)),
  removeItem: jest.fn((k) => {
    delete mockStorage[k];
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map((k) => [k, mockStorage[k] || null]))
  ),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => {
      mockStorage[k] = v;
    });
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => delete mockStorage[k]);
    return Promise.resolve(null);
  }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-toast-message', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ToastComponent = (props) => React.createElement(View, props);
  ToastComponent.show = jest.fn();
  ToastComponent.hide = jest.fn();
  return {
    __esModule: true,
    default: ToastComponent,
    BaseToast: (props) => React.createElement(View, props),
  };
});
