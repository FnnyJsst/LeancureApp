// utils/fileUtils.js
export const formatFileSize = (bytes, options = {}) => {
  const {
    startWithBytes = false,  // Si on veut commencer avec les bytes
    precision = 1,           // Nombre de décimales
    defaultUnit = 'Ko'       // Unité par défaut
  } = options;

  // Si la valeur est une chaîne, essayer de la convertir en nombre
  if (typeof bytes === 'string') {
    bytes = parseFloat(bytes);
  }

  // Si la valeur n'est pas un nombre valide
  if (!bytes || isNaN(bytes) || bytes === 0) {
    return '0 ' + defaultUnit;
  }

  const units = startWithBytes ? ['B', 'Ko', 'Mo', 'Go'] : ['Ko', 'Mo', 'Go'];
  let size = startWithBytes ? bytes : bytes / 1024;
  let unitIndex = startWithBytes ? 0 : 0;

  // Pour les très petits fichiers
  if (size < 0.1) {
    return '0.1 ' + units[unitIndex];
  }

  // Conversion vers les unités supérieures si nécessaire
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Formatage du résultat
  if (size < 10) {
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
  }

  return `${Math.round(size)} ${units[unitIndex]}`;
};