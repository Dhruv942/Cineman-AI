import React from 'react';
import { trackEvent } from '../services/analyticsService';
import { useLanguage } from '../hooks/useLanguage';

interface MyAccountPageProps {
  onBackToMain: () => void;
}

export const MyAccountPage: React.FC<MyAccountPageProps> = ({ onBackToMain }) => {
  const { t } = useLanguage();
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900 p-4 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-400 mx-auto mb-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {t('account_title', 'My Account')}
            </h1>
            <p className="text-slate-300 mb-8">
            {t('account_desc', 'Manage how CineMan AI learns your taste.')}
            </p>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold mb-3 text-sky-300 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.02 6a11.95 11.95 0 0 1 3.96 0m-3.96 0a11.95 11.95 0 0 0-3.96 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm0 0a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
                 </svg>
                {t('account_sync_title', 'Live Platform Sync')}
            </h2>
            <div className="text-sm text-slate-400 space-y-3 mb-4">
                <p>{t('account_sync_desc1', "CineMan AI is now a browser extension that makes learning your taste effortless. You no longer need to manually upload your viewing history!")}</p>
                <p dangerouslySetInnerHTML={{ __html: t('account_sync_desc2', '<strong>How it works:</strong> Simply browse to your "My List" page on supported streaming platforms. The extension will automatically and securely detect the titles you\'ve saved and add them to your taste profile in the background.') }} />
            </div>
            <div className="space-y-2">
                <div className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix Logo" className="w-auto h-5 mr-3"/>
                        <span className="font-semibold text-slate-200">{t('account_sync_netflix', 'Netflix Sync')}</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold text-green-200 bg-green-700/60 rounded-full">
                        {t('account_sync_status_active', 'Active')}
                    </span>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                         <svg viewBox="0 0 1024 303.4" className="w-auto h-6 mr-3" fill="currentColor"><path d="M474.3 259.6c23.2 0 46.2-4.2 68.3-12.3 22.9-8.4 43.1-20.6 60.1-36.3 17-15.7 30.3-34.9 39.2-56.8 9-21.9 13.6-46.2 13.6-72.3 0-22.9-3.4-44.4-10.2-64.1-6.8-19.7-16.7-37.3-29.4-52.2-12.7-15-28-27.2-45.5-36-17.4-8.8-36.6-13.2-57-13.2-22.9 0-44.9 4-65.4 11.9-20.1 7.9-38.1 19.3-53.5 33.7-15.4 14.4-27.4 32.2-35.8 52.9-8.4 20.7-12.7 44-12.7 69.3 0 25.4 4.5 49.8 13.6 72.8 9 23 21.9 42.9 38.3 59.2 16.5 16.3 36.3 29.4 58.9 38.8 22.5 9.4 46.8 14.1 82.5 14.1zm-15.9-43.1c-14.7-2-28.9-5.9-42.2-11.4-13.4-5.5-25.2-12.9-35.3-21.9-10.1-9-18.4-19.8-24.6-32-6.2-12.2-9.4-25.7-9.4-40.1 0-16.1 4.1-30.8 12.3-43.7 8.2-12.9 19.3-23.5 32.9-31.4 13.6-7.9 29.2-11.9 46.4-11.9 14.4 0 28.2 2.9 41.1 8.7 12.9 5.8 24.2 14.1 33.5 24.6 9.3 10.5 16.3 23.3 20.7 38.1 4.4 14.7 6.6 30.8 6.6 47.8 0 16.8-3.5 32.3-10.5 46.2-7 13.9-16.8 26.1-29.1 36.3-12.3 10.2-26.8 18.3-43.1 23.9-16.3 5.7-33.8 8.6-51.9 8.6zm371-216.5h-112v259.1h-52.8V.1h164.8v43h-112v84.9h106.3v43H710.4v88.2zM228.6 259.1h-55.9L121.2 43.1H51.1L0 259.1H50l12.3-35.3h76.3l-12.3 35.3zm-42.2-78.4L200.5 43h.9l14.1 137.7h-72.2zM1024 220.9c0 14.4-11.9 26.3-26.3 26.3s-26.3-11.9-26.3-26.3 11.9-26.3 26.3-26.3 26.3 11.9 26.3 26.3z"></path></svg>
                        <span className="font-semibold text-slate-200">{t('account_sync_prime_video', 'Prime Video Sync')}</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold text-green-200 bg-green-700/60 rounded-full">
                        {t('account_sync_status_active', 'Active')}
                    </span>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                         <svg viewBox="0 0 256 61" className="w-auto h-8 mr-3" fill="currentColor"><path d="M239.944 60.111h15.922V0H239.944ZM0 60.111h15.922V0H0ZM30.456 60.111h15.922V17.944H30.456ZM209.133 17.944h-28.711L162.478 60.11h16.2L182.2 48.056h23.233l3.511 12.056h16.2Zm-11.756 19.3L192.4 22.189h-1.033l-5 15.056ZM59.611 60.111h30.133L101.8 17.944H85.956l-9.622 25.844h-.756l-9.622-25.844H50.022ZM115.1 60.111h15.922V17.944H115.1Z"></path></svg>
                        <span className="font-semibold text-slate-200">{t('account_sync_hotstar', 'Disney+ Hotstar Sync')}</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold text-green-200 bg-green-700/60 rounded-full">
                        {t('account_sync_status_active', 'Active')}
                    </span>
                </div>
            </div>
             <p className="text-xs text-purple-300 italic mt-4">
                {t('account_sync_disclaimer', 'Your data is only stored on your local device and is never sent to our servers. More streaming platforms coming soon!')}
            </p>
        </div>


        <div className="mt-8 text-center">
            <button
            onClick={onBackToMain}
            className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out"
            >
            {t('onboarding_back_to_app_button', 'Back to App')}
            </button>
        </div>

      </div>
    </div>
  );
};