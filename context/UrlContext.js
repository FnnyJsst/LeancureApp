import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UrlContext = createContext();

export const UrlProvider = ({ children }) => {
  const [urls, setUrls] = useState([]);
  const [titles, setTitles] = useState([]);

  // Cette fonction est utilisée pour charger les URLs depuis AsyncStorage
  useEffect(() => {
    const loadUrls = async () => {
      try {
        const storedUrls = await AsyncStorage.getItem('urls');
        if (storedUrls) {
          const parsedUrls = JSON.parse(storedUrls);
          setUrls(parsedUrls);
          loadInitialTitles(parsedUrls);
        }
      } catch (error) {
        console.error('Failed to load URLs', error);
      }
    };

    loadUrls();
  }, []);

  // Cette fonction est utilisée pour sauvegarder les URLs dans AsyncStorage
  useEffect(() => {
    const saveUrls = async () => {
      try {
        await AsyncStorage.setItem('urls', JSON.stringify(urls));
      } catch (error) {
        console.error('Failed to save URLs', error);
      }
    };

    saveUrls();
  }, [urls]);

  // Cette fonction est utilisée pour charger les titres des URLs
  const loadInitialTitles = async (loadedUrls) => {
    const newTitles = await Promise.all(
      loadedUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          return titleMatch ? titleMatch[1] : '';
        } catch (error) {
          console.error('Failed to load title for', url, error);
          return '';
        }
      })
    );
    setTitles((prevTitles) => [...prevTitles.slice(0, -loadedUrls.length), ...newTitles]);
  };

  // Cette fonction est utilisée pour ajouter une URL aux URLs
  const addUrl = (url) => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (Array.isArray(urls) && !urls.includes(formattedUrl)) {
      setUrls((prevUrls) => {
        const newUrls = [...prevUrls, formattedUrl];
        AsyncStorage.setItem('urls', JSON.stringify(newUrls)).catch(error => 
          console.error('Failed to save URLs', error)
        );
        return newUrls;
      });
      
      setTitles((prevTitles) => [...prevTitles, '']); 
      
      loadInitialTitles([formattedUrl]);
    } else {
      console.warn("Cette URL existe déjà.");
    }
  };

  // Cette fonction est utilisée pour mettre à jour les URLs
  const updateUrl = (newUrls) => {
    setUrls(newUrls);
    AsyncStorage.setItem('urls', JSON.stringify(newUrls)).catch(error => 
      console.error('Failed to save URLs', error)
    );
    loadInitialTitles(newUrls);
  };

  const updateTitle = (index, newTitle) => {
    setTitles((prevTitles) => {
      const updatedTitles = [...prevTitles];
      updatedTitles[index] = newTitle;
      return updatedTitles;
    });
  };

  return (
    <UrlContext.Provider value={{ urls, titles, setUrls, addUrl, updateUrl, updateTitle }}>
      {children}
    </UrlContext.Provider>
  );
};

export const useUrls = () => React.useContext(UrlContext);