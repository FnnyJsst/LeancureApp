const { withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

module.exports = function withAndroidSecurityConfig(config) {
  return withAndroidManifest(config, async (config) => {
    try {
      // Créer le dossier xml s'il n'existe pas
      const xmlPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      await fs.promises.mkdir(xmlPath, { recursive: true });

      // Écrire le fichier de configuration
      await fs.promises.writeFile(
        path.join(xmlPath, 'network_security_config.xml'),
        networkSecurityConfig
      );

      // Modifier directement le manifest
      const androidManifest = config.modResults.manifest;

      // S'assurer que application existe
      if (!androidManifest.application) {
        androidManifest.application = [{ $: {} }];
      }

      // Ajouter les attributs de sécurité
      if (androidManifest.application[0]) {
        androidManifest.application[0].$['android:usesCleartextTraffic'] = 'true';
        androidManifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';
      }

      return config;
    } catch (e) {
      console.error("Erreur dans le plugin Android Security Config:", e);
      throw e;
    }
  });
};
