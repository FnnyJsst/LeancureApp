import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UrlContext = createContext();

export const UrlProvider = ({ children }) => {
  const [urls, setUrls] = useState([]);
  const [titles, setTitles] = useState([]);

  // Load URLs from AsyncStorage
  useEffect(() => {
    const loadUrls = async () => {
      try {
        const storedUrls = await AsyncStorage.getItem('urls');
        // If URLs are stored, parse them and set them to state
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

  // Save URLs to AsyncStorage
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

  // Load initial titles for URLs
  const loadInitialTitles = async (loadedUrls) => {
    // Fetch titles for each URL
    const newTitles = await Promise.all(
      loadedUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          // Get HTML content of the page
          const html = await response.text();
          // Extract title from HTML
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          // Return title if found, otherwise return empty string
          return titleMatch ? titleMatch[1] : '';
        } catch (error) {
          console.error('Failed to load title for', url, error);
          return '';
        }
      })
    );
    // Update titles state with new titles
    setTitles((prevTitles) => [...prevTitles.slice(0, -loadedUrls.length), ...newTitles]);
  };

  // Add a URL to URLs
  const addUrl = (url) => {
    // Trim the URL
    let formattedUrl = url.trim();
    // Add the HTTPS protocol if it's missing
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Add the URL to URLs if it's not already in the list
    if (Array.isArray(urls) && !urls.includes(formattedUrl)) {
      setUrls((prevUrls) => {
        const newUrls = [...prevUrls, formattedUrl];
        // Save the new URLs to AsyncStorage
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

  // Update URLs
  const updateUrl = (newUrls) => {
    setUrls(newUrls);
    // Save new URLs to AsyncStorage
    AsyncStorage.setItem('urls', JSON.stringify(newUrls)).catch(error => 
      console.error('Failed to save URLs', error)
    );
    loadInitialTitles(newUrls);
  };

  // Update titles
  const updateTitle = (index, newTitle) => {
    setTitles((prevTitles) => {
      // Update the titles array with the new title
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