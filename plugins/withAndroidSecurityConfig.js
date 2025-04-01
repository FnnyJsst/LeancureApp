const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ajouter la configuration de sécurité réseau
    const application = androidManifest.manifest.application[0];
    if (!application['android:usesCleartextTraffic']) {
      application['android:usesCleartextTraffic'] = 'true';
    }

    return config;
  });
};

module.exports = withAndroidSecurityConfig;