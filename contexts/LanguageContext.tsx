import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CINE_SUGGEST_TRANSLATIONS_KEY_PREFIX, CINE_SUGGEST_USER_LANGUAGE_KEY, SUPPORTED_TRANSLATION_LANGUAGES } from '../constants';
import { en } from '../translations/en';
import { translateUI } from '../services/translationService';
import type { Translations, Language as LanguageType } from '../types';

interface LanguageContextType {
  language: string;
  setLanguage: (langCode: string) => void;
  t: (key: keyof Translations, defaultText?: string, replacements?: Record<string, string | number>) => string;
  isLoading: boolean;
  supportedLanguages: LanguageType[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Translations>(en);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setLanguage = useCallback(async (langCode: string) => {
    if (!SUPPORTED_TRANSLATION_LANGUAGES.some(l => l.code === langCode)) {
      console.warn(`Attempted to set unsupported language: ${langCode}`);
      return;
    }

    setIsLoading(true);
    document.documentElement.lang = langCode;
    localStorage.setItem(CINE_SUGGEST_USER_LANGUAGE_KEY, langCode);
    setLanguageState(langCode);

    if (langCode === 'en') {
      setTranslations(en);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `${CINE_SUGGEST_TRANSLATIONS_KEY_PREFIX}${langCode}`;
    const cachedTranslations = localStorage.getItem(cacheKey);
    if (cachedTranslations) {
      try {
        setTranslations(JSON.parse(cachedTranslations));
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse cached translations", e);
        localStorage.removeItem(cacheKey); // Clear corrupted cache
      }
    }

    // If not in cache, fetch from API
    const newTranslations = await translateUI(langCode);
    localStorage.setItem(cacheKey, JSON.stringify(newTranslations));
    setTranslations(newTranslations);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const initializeLanguage = async () => {
      // 1. Check for a previously saved user preference.
      const savedLang = localStorage.getItem(CINE_SUGGEST_USER_LANGUAGE_KEY);
      
      if (savedLang && SUPPORTED_TRANSLATION_LANGUAGES.some(l => l.code === savedLang)) {
        // If a language is saved, load it. This will show the loader for returning users with a non-en preference, which is correct.
        await setLanguage(savedLang);
      } else {
        // 2. If no language is saved (new user), default to English without any loading.
        setLanguageState('en');
        setTranslations(en);
        document.documentElement.lang = 'en';
        setIsLoading(false); // Immediately finish loading, no API call.
      }
    };
    initializeLanguage();
  }, [setLanguage]);

  const t = useCallback((key: keyof Translations, defaultText?: string, replacements?: Record<string, string | number>): string => {
    let translated = translations[key] || defaultText || en[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(`{${placeholder}}`, 'g');
            translated = translated.replace(regex, String(replacements[placeholder]));
        });
    }
    return translated;
  }, [translations]);

  const value = {
    language,
    setLanguage,
    t,
    isLoading,
    supportedLanguages: SUPPORTED_TRANSLATION_LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};