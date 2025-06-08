// styles/themes.ts - Enhanced Theme System
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/utils/constants';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      disabled: string;
    };
    border: {
      primary: string;
      secondary: string;
      focus: string;
      error: string;
      success: string;
    };
    status: {
      success: string;
      error: string;
      warning: string;
      info: string;
    };
    gradient: {
      primary: string[];
      secondary: string[];
      accent: string[];
    };
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  layout: {
    headerHeight: number;
    tabBarHeight: number;
    containerPadding: number;
    cardPadding: number;
  };
}

// Light Theme
export const lightTheme: Theme = {
  colors: {
    primary: Colors.primary[500],
    secondary: Colors.secondary[500],
    accent: Colors.accent.mint,
    background: {
      primary: Colors.white,
      secondary: Colors.gray[50],
      tertiary: Colors.gray[100],
      elevated: Colors.white,
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: Colors.gray[900],
      secondary: Colors.gray[600],
      tertiary: Colors.gray[500],
      inverse: Colors.white,
      disabled: Colors.gray[400],
    },
    border: {
      primary: Colors.gray[200],
      secondary: Colors.gray[300],
      focus: Colors.primary[500],
      error: Colors.error[500],
      success: Colors.success[500],
    },
    status: {
      success: Colors.success[500],
      error: Colors.error[500],
      warning: Colors.warning[500],
      info: Colors.info[500],
    },
    gradient: {
      primary: Colors.gradients.primary,
      secondary: Colors.gradients.secondary,
      accent: Colors.gradients.ocean,
    },
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: {
    headerHeight: 56,
    tabBarHeight: 60,
    containerPadding: 20,
    cardPadding: 16,
  },
};

// Dark Theme
export const darkTheme: Theme = {
  colors: {
    primary: Colors.primary[400],
    secondary: Colors.secondary[400],
    accent: Colors.accent.mint,
    background: {
      primary: Colors.gray[900],
      secondary: Colors.gray[800],
      tertiary: Colors.gray[700],
      elevated: Colors.gray[800],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: Colors.white,
      secondary: Colors.gray[300],
      tertiary: Colors.gray[400],
      inverse: Colors.gray[900],
      disabled: Colors.gray[600],
    },
    border: {
      primary: Colors.gray[700],
      secondary: Colors.gray[600],
      focus: Colors.primary[400],
      error: Colors.error[500],
      success: Colors.success[500],
    },
    status: {
      success: Colors.success[500],
      error: Colors.error[500],
      warning: Colors.warning[500],
      info: Colors.info[500],
    },
    gradient: {
      primary: [Colors.primary[600], Colors.primary[400]],
      secondary: [Colors.secondary[600], Colors.secondary[400]],
      accent: [Colors.accent.mint, Colors.accent.coral],
    },
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: {
    // Darker shadows for dark theme
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      elevation: 12,
    },
  },
  layout: {
    headerHeight: 56,
    tabBarHeight: 60,
    containerPadding: 20,
    cardPadding: 16,
  },
};

// Theme context and hook
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/utils/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Get current theme
  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(StorageKeys.THEME_PREFERENCE);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(StorageKeys.THEME_PREFERENCE, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextValue = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    React.createElement(
      ThemeContext.Provider,
      { value },
      children
    )
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFactory(theme);
};

// Common themed components styles
export const getThemedButtonStyles = (theme: Theme, variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
  const baseStyles = {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: theme.colors.primary,
      };
    case 'secondary':
      return {
        ...baseStyles,
        backgroundColor: theme.colors.background.tertiary,
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
      };
    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      };
    default:
      return baseStyles;
  }
};

export const getThemedTextStyles = (theme: Theme, variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
  const baseStyles = {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        color: theme.colors.text.primary,
      };
    case 'secondary':
      return {
        ...baseStyles,
        color: theme.colors.text.secondary,
      };
    case 'tertiary':
      return {
        ...baseStyles,
        color: theme.colors.text.tertiary,
      };
    default:
      return baseStyles;
  }
};

export const getThemedCardStyles = (theme: Theme) => ({
  backgroundColor: theme.colors.background.elevated,
  borderRadius: theme.borderRadius['2xl'],
  padding: theme.layout.cardPadding,
  ...theme.shadows.md,
  borderWidth: 1,
  borderColor: theme.colors.border.primary,
});

export const getThemedInputStyles = (theme: Theme, hasError = false, isFocused = false) => ({
  backgroundColor: theme.colors.background.secondary,
  borderWidth: 2,
  borderColor: hasError 
    ? theme.colors.border.error 
    : isFocused 
    ? theme.colors.border.focus 
    : theme.colors.border.primary,
  borderRadius: theme.borderRadius.xl,
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.lg,
  fontSize: theme.typography.fontSize.base,
  color: theme.colors.text.primary,
  minHeight: 48,
});

// Export themes for direct use
export { lightTheme as defaultTheme };
export default {
  light: lightTheme,
  dark: darkTheme,
};