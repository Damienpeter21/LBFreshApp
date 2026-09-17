module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-vector-icons|react-native-toast-message|react-native-gesture-handler|react-native-screens|react-native-safe-area-context)/)',
  ],
};
