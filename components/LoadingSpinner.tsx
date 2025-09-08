import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { en } from '../translations/en';

const loadingKeys: (keyof typeof en)[] = Object.keys(en).filter(k => k.startsWith('loading_')) as (keyof typeof en)[];


export const LoadingSpinner: React.FC = () => {
  const { t } = useLanguage();
  const [currentKey, setCurrentKey] = useState<keyof typeof en>(loadingKeys[Math.floor(Math.random() * loadingKeys.length)]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentKey(loadingKeys[Math.floor(Math.random() * loadingKeys.length)]);
    }, 3500); // Change text every 3.5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
      <p className="text-xl text-purple-300 font-semibold">{t(currentKey, 'Loading...')}</p>
      <p className="text-sm text-slate-400">{t('loading_patience', 'Patience, young padawan... good movies come to those who wait.')}</p>
    </div>
  );
};
