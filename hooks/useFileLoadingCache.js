import { useState, useEffect, useRef } from 'react';

// Cache to store the loading state of files
const loadedFilesCache = new Map();

export const useFileLoadingCache = (messageId, fileType, base64, fileName) => {
  const [isFileLoading, setIsFileLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // If the file is already marked as loaded in this component, do nothing
    if (hasLoadedRef.current) {
      return;
    }

    // First, check if the file is already in the cache
    if (loadedFilesCache.has(messageId)) {
      setIsFileLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    // Consider the file loaded if:
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
      // If the file is loaded, add it to the cache with a timestamp
      loadedFilesCache.set(messageId, {
        timestamp: Date.now(),
        hasLoaded: true
      });
      setIsFileLoading(false);
      hasLoadedRef.current = true;
    }
  }, [messageId, fileType, base64, fileName]);

  // No longer clean the cache when the component unmounts
  // The cache is now persistent

  return isFileLoading;
};