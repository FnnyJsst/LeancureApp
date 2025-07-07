// Polyfills minimaux pour Expo SDK 53
import { Buffer } from '@craftzdog/react-native-buffer';

// Rendre Buffer disponible globalement
global.Buffer = Buffer;

// Polyfill pour atob si nécessaire (pour le décodage base64)
if (!global.atob) {
  global.atob = (str) => {
    return Buffer.from(str, 'base64').toString('binary');
  };
}

// Polyfill pour btoa si nécessaire (pour l'encodage base64)
if (!global.btoa) {
  global.btoa = (str) => {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

export default polyfills;