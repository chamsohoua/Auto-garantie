import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
const lightColors = {
  primary: '#1E4E8C',       
  primaryHover: '#3A82E6',   
  background: '#F9F9F9',     
  surface: '#FFFFFF',       
  text: '#0c0c0c',          
  textSecondary: '#4D4D4E',  
  textMuted: '#AEAEAE',      
  border: '#4D4D4E',         
  success: '#10B981',        
  warning: '#F59E0B',        
  error: '#E81A1A',          
  accent: '#0A2540',     
  gold:            '#C9A84C',
  surfaceElevated: '#FAFCFF',
  divider:         '#EBF0F6',
  placeholder:     '#9AAFC7',
  textPrimary:     '#0D1B2E',
  textInverse:     '#FFFFFF',
  overlay:         'rgba(11,57,113,0.55)',  
};

const darkColors = {
  primary: '#0B3971',        
  primaryHover: '#1A5BAA',   
  background: '#1e1e1e',     
  surface: '#303030',        
  text: '#F9F9F9',           
  textSecondary: '#AEAEAE',  
  textMuted: '#4D4D4E',      
  border: '#F3F3F3',         
  success: '#10B981',        
  warning: '#F59E0B',        
  error: '#E81A1A',          
  accent: '#227dd8ff',      
  gold:            '#C9A84C',
  surfaceElevated: '#FAFCFF',
  divider:         '#EBF0F6',
  placeholder:     '#9AAFC7',
  textPrimary:     '#0D1B2E',
  textInverse:     '#FFFFFF',
  overlay:         'rgba(11,57,113,0.55)',    
};
export const Typography = {
fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium:  Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', 
    bold:    Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed-bold',
    black:   Platform.OS === 'ios' ? 'System' : 'sans-serif-black', 
  },
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  30,
    hero: 38,
  },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  xxl: 32,
  huge:48,
};

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0B3971',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  md: {
    shadowColor: '#0B3971',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 8,
  },
  lg: {
    shadowColor: '#0B3971',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  xl: {
    shadowColor: '#0B3971',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
};
export const FlatBorder = {
  xs: {
    borderWidth: 1,
    borderColor: 'rgba(11, 57, 113, 0.06)',
  },
  sm: {
    borderWidth: 1,
    borderColor: 'rgba(11, 57, 113, 0.09)',
  },
  md: {
    borderWidth: 1,
    borderColor: 'rgba(11, 57, 113, 0.13)',
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
};