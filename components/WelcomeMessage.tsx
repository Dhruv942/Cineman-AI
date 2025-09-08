import React from 'react';
import type { RecommendationType } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface WelcomeMessageProps {
  itemType: RecommendationType;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ itemType }) => {
  const { t } = useLanguage();
  const currentItemTypeString = itemType === 'series' ? t('series', 'series') : t('movies', 'movie');
  const otherItemTypeString = itemType === 'series' ? t('movies', 'movie') : t('series', 'series');
  return (
    <div className="mt-12 text-center bg-slate-800 p-8 rounded-xl shadow-2xl">
      <div className="flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        {t('welcome_title', 'Welcome to CineMan AI!')}
      </h2>
      <p className="text-lg text-slate-300 mb-2">
        {t('welcome_subtitle', "Ready to discover your next favorite {itemType}?", { itemType: currentItemTypeString })}
      </p>
      <p className="text-slate-400 max-w-xl mx-auto">
        {t('welcome_description', "Tell us your preferences below – select genres, describe your mood, add keywords, or pick an era – and let our AI find personalized {itemType} recommendations just for you.", { itemType: currentItemTypeString })}
      </p>
       <p className="text-slate-400 max-w-xl mx-auto mt-3" dangerouslySetInnerHTML={{ __html: t('welcome_tip', 'Or, try our <span class="font-semibold text-sky-400">Find Similar</span> tab to find something like a {itemType} you already love! You can also switch to finding {otherItemType}s using the selector above the tabs.', { itemType: currentItemTypeString, otherItemType: otherItemTypeString }) }}>
      </p>
    </div>
  );
};
