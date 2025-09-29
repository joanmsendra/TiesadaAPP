import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../constants/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.default);
  const [themeName, setThemeName] = useState('default');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeName = await AsyncStorage.getItem('selectedTheme');
        if (savedThemeName && themes[savedThemeName]) {
          setTheme(themes[savedThemeName]);
          setThemeName(savedThemeName);
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
      }
    };

    loadTheme();
  }, []);

  const changeTheme = async (name) => {
    if (themes[name]) {
      try {
        await AsyncStorage.setItem('selectedTheme', name);
        setTheme(themes[name]);
        setThemeName(name);
      } catch (error) {
        console.error('Failed to save theme to storage', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
