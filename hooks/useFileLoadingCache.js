import { useState, useEffect, useRef } from 'react';

// Cache pour stocker l'état de chargement des fichiers
const loadedFilesCache = new Map();

export const useFileLoadingCache = (messageId, fileType, base64, fileName) => {
  const [isFileLoading, setIsFileLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Si le fichier est déjà marqué comme chargé dans ce composant, on ne fait rien
    if (hasLoadedRef.current) {
      return;
    }

    // On vérifie d'abord si le fichier est déjà dans le cache
    if (loadedFilesCache.has(messageId)) {
      setIsFileLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    // On considère que le fichier est chargé si :
    // 1. On a une base64 valide OU
    // 2. On a un message de type fichier avec un nom de fichier (pour les PDFs qui n'ont pas de base64)
    const hasFileData = (base64 && base64.length > 0) ||
                       (fileName && (fileType?.includes('pdf') || fileType?.includes('csv')));

    console.log('🔍 [useFileLoadingCache] État du chargement du fichier:', {
      id: messageId,
      fileName,
      fileType,
      hasFileData,
      hasBase64: !!base64,
      base64Length: base64?.length,
      isFileLoading: !hasFileData,
      isInCache: loadedFilesCache.has(messageId)
    });

    if (hasFileData) {
      // Si le fichier est chargé, on l'ajoute au cache avec un timestamp
      loadedFilesCache.set(messageId, {
        timestamp: Date.now(),
        hasLoaded: true
      });
      setIsFileLoading(false);
      hasLoadedRef.current = true;
    }
  }, [messageId, fileType, base64, fileName]);

  // On ne nettoie plus le cache au démontage du composant
  // Le cache est maintenant persistant

  return isFileLoading;
};