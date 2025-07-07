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
      // Create the xml folder if it does not exist
      const xmlPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      await fs.promises.mkdir(xmlPath, { recursive: true });

      // Write the configuration file
      const configPath = path.join(xmlPath, 'network_security_config.xml');
      await fs.promises.writeFile(configPath, networkSecurityConfig);

      // Modify the manifest
      const androidManifest = config.modResults;
      if (!androidManifest.manifest) {
        androidManifest.manifest = { application: [{ $: {} }] };
      }

      const mainApplication = androidManifest.manifest.application?.[0];
      if (!mainApplication) {
        androidManifest.manifest.application = [{ $: {} }];
      }

      // Ensure the $ object exists
      if (!androidManifest.manifest.application[0].$) {
        androidManifest.manifest.application[0].$ = {};
      }

      // Add security attributes
      androidManifest.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
      androidManifest.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';

      return config;
    } catch (e) {
      console.error("Error in Android Security Config plugin:", e);
      throw e;
    }
  });
};