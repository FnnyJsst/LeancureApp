import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UrlContext = createContext();

export const UrlProvider = ({ children }) => {
  const [urls, setUrls] = useState([]);
  const [titles, setTitles] = useState([]);

  // This function is used to load the URLs from the AsyncStorage
  useEffect(() => {
    const loadUrls = async () => {
      try {
        const storedUrls = await AsyncStorage.getItem('urls');
        // if we have stored urls, we load them
        if (storedUrls) {
          const parsedUrls = JSON.parse(storedUrls);
          setUrls(parsedUrls);
          loadInitialTitles(parsedUrls);
        }
      // if we don't, we log an error
      } catch (error) {
        console.error('Failed to load URLs', error);
      }
    };

    loadUrls();
  }, []);

  // This function is used to save the URLs to the AsyncStorage
  useEffect(() => {
    const saveUrls = async () => {
      try {
        await AsyncStorage.setItem('urls', JSON.stringify(urls));
        // If we don't have any urls, we log an error
      } catch (error) {
        console.error('Failed to save URLs', error);
      }
    };

    saveUrls();
  }, [urls]);

  // This function is used to load the titles of the URLs
  const loadInitialTitles = async (loadedUrls) => {
    const newTitles = await Promise.all(
      // We load the titles of the URLs
      loadedUrls.map(async (url) => {
        try {
          // We fetch the URL
          const response = await fetch(url);
          // We get the HTML of the URL
          const html = await response.text();
          // We get the title of the URL
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          // We return the title of the URL
          return titleMatch ? titleMatch[1] : '';
          // If we can't get the title, we log an error
        } catch (error) {
          console.error('Failed to load title for', url, error);
          return '';
        }
      })
    );
    setTitles((prevTitles) => [...prevTitles.slice(0, -loadedUrls.length), ...newTitles]);
  };

// This function is used to add a URL to the URLs
const addUrl = (url) => {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Check if the URL already exists
  if (!urls.includes(formattedUrl)) {
    setUrls((prevUrls) => {
      const newUrls = [...prevUrls, formattedUrl];
      // Save the new URLs to the AsyncStorage
      AsyncStorage.setItem('urls', JSON.stringify(newUrls)).catch(error => 
        console.error('Failed to save URLs', error)
      );
      return newUrls;
    });
    
    setTitles((prevTitles) => [...prevTitles, '']); 
    
    // Load the title for the new URL
    loadInitialTitles([formattedUrl]);
  } else {
    console.warn("Cette URL existe déjà.");
  }
};

  // This function is used to update the URLs
  const updateUrl = (newUrls) => {
    setUrls(newUrls);
    // We save the new URLs to the AsyncStorage
    AsyncStorage.setItem('urls', JSON.stringify(newUrls)).catch(error => 
      console.error('Failed to save URLs', error)
    );
    loadInitialTitles(newUrls);
  };

  const updateTitle = (index, newTitle) => {
    setTitles((prevTitles) => {
      // We update the titles of the URLs
      const updatedTitles = [...prevTitles];
      // We save the new titles to the AsyncStorage
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