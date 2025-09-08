

declare const chrome: any;
import React, { useState, useEffect, useCallback } from 'react';
import type { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { LoadingSpinner } from './LoadingSpinner';
import { CINE_SUGGEST_WATCHLIST_KEY, ICONS } from '../constants';
import { trackEvent } from '../services/analyticsService';
import { useLanguage } from '../hooks/useLanguage';
import { getWatchlist, clearWatchlist, removeFromWatchlist } from '../services/watchlistService';


interface WatchlistViewProps {
  isActive: boolean;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({ isActive }) => {
  const { t } = useLanguage();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    const list = await getWatchlist();
    setWatchlist(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      trackEvent('tab_view', { tab_name: 'watchlist' });
      fetchWatchlist();

      // Listen for changes in storage to update the list in real-time
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes[CINE_SUGGEST_WATCHLIST_KEY]) {
          setWatchlist(changes[CINE_SUGGEST_WATCHLIST_KEY].newValue || []);
        }
      };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        };
      }
    }
  }, [isActive, fetchWatchlist]);

  const handleClearList = async () => {
    trackEvent('watchlist_clear', { list_size: watchlist.length });
    await clearWatchlist();
    setWatchlist([]);
  };
  
  const handleRemoveItem = async (itemId: string) => {
    const itemToRemove = watchlist.find(i => i.id === itemId);
    if (itemToRemove) {
      trackEvent('watchlist_remove_item', { title: itemToRemove.title });
    }
    await removeFromWatchlist(itemId);
    // Optimistically update the UI, the storage listener will catch the definitive state
    setWatchlist(prev => prev.filter(item => item.id !== itemId));
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center">
            <LoadingSpinner />
        </div>
      );
    }

    if (watchlist.length === 0) {
      return (
        <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full">
          <span dangerouslySetInnerHTML={{ __html: ICONS.watchlist_tab_icon }} className="w-20 h-20 text-purple-400 mb-6" />
          <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {t('watchlist_empty_title', 'Your Global Watchlist is Empty')}
          </h2>
          <p className="text-slate-300 mb-2 max-w-md">
            {t('watchlist_empty_desc', 'Use the "Add to Watchlist" button on Google search results or streaming sites like Netflix to build your universal list.')}
          </p>
          <p className="text-xs text-slate-400 max-w-md">
            {t('watchlist_empty_tip', '(Support for more sites is coming soon!)')}
          </p>
        </div>
      );
    }
    
    return (
      <div className="w-full">
         <h2 
            id="watchlist-title"
            className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
        >
            {t('watchlist_title', 'Your Global Watchlist')}
        </h2>
        <div className="grid gap-6 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {watchlist.map(movie => (
                <div key={movie.id} className="relative group">
                    <MovieCard movie={movie} />
                    <button 
                        onClick={() => handleRemoveItem(movie.id!)}
                        className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                        title={t('watchlist_remove_item_title', 'Remove from watchlist')}
                        aria-label={t('watchlist_remove_item_aria', `Remove ${movie.title} from watchlist`, { title: movie.title })}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
        <div className="text-center mt-12">
            <button
                onClick={handleClearList}
                className="px-6 py-2.5 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors"
            >
                {t('watchlist_clear', 'Clear Watchlist')}
            </button>
        </div>
      </div>
    );
  };
  
  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-start py-8 px-2 w-full flex-grow min-h-0">
      {renderContent()}
    </div>
  );
};