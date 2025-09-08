import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

/**
 * Custom hook to access the language context.
 * Provides an easy way to get the current language, change it, and use the translation function.
 * Throws an error if used outside of a LanguageProvider.
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
