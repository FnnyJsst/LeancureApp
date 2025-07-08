module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@constants': './constants',
            '@utils': './utils',
            '@services': './services',
            '@hooks': './hooks',
            '@config': './config',
            '@assets': './assets',
            '@navigation': './navigation',
            '@context': './context',
            '@store': './store',
            '@api': './api',
            '@theme': './theme',
            '@types': './types',
            '@i18n': './i18n',
            '@validation': './validation',
            '@errors': './errors',
            '@models': './models',
            '@interfaces': './interfaces',
            '@enums': './enums',
            // Polyfills pour les modules Node.js
            'buffer': '@craftzdog/react-native-buffer'
          }
        }
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env.production',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true
        }
      ]
    ]
  };
};