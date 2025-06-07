const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Ensure proper module resolution
config.resolver.alias = {
  ...config.resolver.alias,
};

module.exports = config;