import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-slate-900/30 py-6 text-center mt-12 border-t border-slate-700">
      <p className="text-slate-400 text-sm">
        {t('footer_copyright', '© {year} CineMan AI. Powered by Gemini.', { year: new Date().getFullYear() })}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {t('footer_disclaimer', 'Disclaimer: Movie recommendations are AI-generated and may not always be perfect.')}
      </p>
    </footer>
  );
};
