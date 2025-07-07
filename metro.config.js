const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour les polyfills nécessaires
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: '@craftzdog/react-native-buffer',
};

// Configuration pour les extensions de fichiers
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  ...config.resolver.sourceExts,
];

// Configuration pour les plateformes
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;