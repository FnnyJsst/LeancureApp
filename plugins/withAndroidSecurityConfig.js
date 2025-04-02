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
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>`;

module.exports = function withAndroidSecurityConfig(config) {
  return withAndroidManifest(config, async (config) => {
    try {
      // Créer le dossier xml s'il n'existe pas
      const xmlPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      await fs.promises.mkdir(xmlPath, { recursive: true });

      // Écrire le fichier de configuration
      const configPath = path.join(xmlPath, 'network_security_config.xml');
      await fs.promises.writeFile(configPath, networkSecurityConfig);

      // Modifier le manifest
      const androidManifest = config.modResults;
      if (!androidManifest.manifest) {
        androidManifest.manifest = { application: [{ $: {} }] };
      }

      const mainApplication = androidManifest.manifest.application?.[0];
      if (!mainApplication) {
        androidManifest.manifest.application = [{ $: {} }];
      }

      // S'assurer que l'objet $ existe
      if (!androidManifest.manifest.application[0].$) {
        androidManifest.manifest.application[0].$ = {};
      }

      // Ajouter les attributs de sécurité
      androidManifest.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
      androidManifest.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';

      return config;
    } catch (e) {
      console.error("Erreur dans le plugin Android Security Config:", e);
      throw e;
    }
  });
};