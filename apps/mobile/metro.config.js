const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude react-native-maps on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // On web, return a mock for react-native-maps
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
