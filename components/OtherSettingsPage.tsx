declare const chrome: any;
import React, { useState, useEffect, useRef } from 'react';
import type { AppSettings } from '../types';
import { CINE_SUGGEST_APP_SETTINGS_KEY } from '../constants';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';

interface OtherSettingsPageProps {
  onBackToMain: () => void;
}

export const OtherSettingsPage: React.FC<OtherSettingsPageProps> = ({ onBackToMain }) => {
  const { t } = useLanguage();
  const [numRecommendations, setNumRecommendations] = useState<number>(6);
  const [numSimilarItems, setNumSimilarItems] = useState<number>(3);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const loadSettings = () => {
      const defaultSettings: AppSettings = { numberOfRecommendations: 6, numberOfSimilarItems: 3 };
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([CINE_SUGGEST_APP_SETTINGS_KEY], (result: any) => {
          const settings = result[CINE_SUGGEST_APP_SETTINGS_KEY];
          if (settings) {
            setNumRecommendations(settings.numberOfRecommendations ?? defaultSettings.numberOfRecommendations);
            setNumSimilarItems(settings.numberOfSimilarItems ?? defaultSettings.numberOfSimilarItems);
          } else {
            chrome.storage.local.set({ [CINE_SUGGEST_APP_SETTINGS_KEY]: defaultSettings });
          }
        });
      } else {
        const storedSettingsString = localStorage.getItem(CINE_SUGGEST_APP_SETTINGS_KEY);
        if (storedSettingsString) {
          try {
            const storedSettings = JSON.parse(storedSettingsString) as AppSettings;
            setNumRecommendations(storedSettings.numberOfRecommendations ?? defaultSettings.numberOfRecommendations);
            setNumSimilarItems(storedSettings.numberOfSimilarItems ?? defaultSettings.numberOfSimilarItems);
          } catch (e) { console.error("Error parsing stored settings", e); }
        }
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newSettings: AppSettings = {
      numberOfRecommendations: numRecommendations,
      numberOfSimilarItems: numSimilarItems,
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [CINE_SUGGEST_APP_SETTINGS_KEY]: newSettings });
    } else {
        localStorage.setItem(CINE_SUGGEST_APP_SETTINGS_KEY, JSON.stringify(newSettings));
    }
  }, [numRecommendations, numSimilarItems]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900 p-4 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-lg text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-sky-400 mx-auto mb-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.44 1.022.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.427.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
          {t('settings_page_title', 'Other Settings')}
        </h1>
        <p className="text-slate-300 mb-8">
          {t('settings_page_desc', 'Adjust application settings to your preference.')}
        </p>

        <div className="mb-8 space-y-8 text-left">
          <div>
            <label htmlFor="numRecommendations" className="block text-lg font-medium text-sky-300 mb-2 text-center">
              {t('settings_recommendations_per_search', 'Recommendations per Search:')} <span className="font-bold text-xl text-white">{numRecommendations}</span>
            </label>
            <input
              type="range"
              id="numRecommendations"
              min="1"
              max="10"
              step="1"
              value={numRecommendations}
              onChange={(e) => setNumRecommendations(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              aria-label={`Number of recommendations: ${numRecommendations}`}
            />
             <div className="flex justify-between text-xs text-slate-400 px-1 mt-1">
                <span>1</span>
                <span>10</span>
            </div>
          </div>

           <div>
            <label htmlFor="numSimilarItems" className="block text-lg font-medium text-sky-300 mb-2 text-center">
              {t('settings_similar_items_per_search', 'Similar Items per "View More":')} <span className="font-bold text-xl text-white">{numSimilarItems}</span>
            </label>
            <input
              type="range"
              id="numSimilarItems"
              min="1"
              max="6"
              step="1"
              value={numSimilarItems}
              onChange={(e) => setNumSimilarItems(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              aria-label={`Number of similar items: ${numSimilarItems}`}
            />
             <div className="flex justify-between text-xs text-slate-400 px-1 mt-1">
                <span>1</span>
                <span>6</span>
            </div>
          </div>
          
          <div>
            <label id="language-select-label" className="block text-lg font-medium text-sky-300 mb-2 text-center">
              {t('settings_language_label', 'Application Language')}
            </label>
            <p className="text-xs text-slate-400 text-center mb-3">
              {t('settings_language_desc', 'Change the display language of the CineMan AI interface.')}
            </p>
            <div className="flex justify-center">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <button
          onClick={onBackToMain}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
        >
          {t('onboarding_back_to_app_button', 'Back to App')}
        </button>
      </div>
      <footer className="absolute bottom-6 text-center w-full">
        <p className="text-slate-400 text-sm">
          {t('footer_copyright', '© {year} CineMan AI. Powered by Gemini.', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
};