
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { POPULAR_MOVIES_FOR_SUGGESTION, POPULAR_SERIES_FOR_SUGGESTION, ICONS } from '../constants';
import type { Movie, RecommendationType, PopularItemEntry } from '../types';
import { getAllFeedback } from '../services/feedbackService';
import { MovieList } from './MovieList'; // Re-use MovieCard for displaying the list
import { WatchPartyCard } from './WatchPartyCard'; // A new card for the swiping part


const MAX_VISIBLE_CARDS = 3;

interface WatchPartyViewProps {
  isActive: boolean;
  recommendationType: RecommendationType;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const WatchPartyView: React.FC<WatchPartyViewProps> = ({ isActive, recommendationType }) => {
  const [itemQueue, setItemQueue] = useState<Movie[]>([]);
  const [partyWatchlist, setPartyWatchlist] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationAction, setAnimationAction] = useState<string | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [hasStartedParty, setHasStartedParty] = useState(false);

  const itemTypeString = recommendationType === 'series' ? 'Series' : 'Movies';
  const popularItemsSource = recommendationType === 'series' ? POPULAR_SERIES_FOR_SUGGESTION : POPULAR_MOVIES_FOR_SUGGESTION;

  const loadInitialItems = useCallback(() => {
    const allPreviouslyRated = getAllFeedback(); // User's personal feedback
    const previouslyRatedIds = new Set(allPreviouslyRated.map(fb => `${fb.title}-${fb.year}`));

    const availableItems: Movie[] = popularItemsSource
      .filter(pm => !previouslyRatedIds.has(`${pm.title}-${pm.year}`))
      .map((pm: PopularItemEntry) => ({
        id: `${pm.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${pm.year}`,
        title: pm.title,
        year: pm.year,
        posterUrl: pm.posterUrl,
        summary: '',
        genres: [],
      }));

    setItemQueue(shuffleArray(availableItems));
    setCurrentIndex(0);
    setAnimationAction(null);
    setIsLoadingNext(false);
  }, [popularItemsSource]);

  const startParty = () => {
    setHasStartedParty(true);
    setPartyWatchlist([]); // Clear previous party list
    loadInitialItems();
  };
  
  const clearPartyAndRestart = () => {
    setPartyWatchlist([]);
    setHasStartedParty(false); // Go back to initial welcome screen for Watch Party
    setItemQueue([]);
    setCurrentIndex(0);
  }

  useEffect(() => {
    if (isActive) {
      // Don't auto-start, let user click the button
      if (hasStartedParty) {
         loadInitialItems(); // If party was active and tab is re-activated, reload/reshuffle
      }
    } else {
      // Optionally reset state when tab becomes inactive
      // setHasStartedParty(false);
      // setItemQueue([]);
      // setPartyWatchlist([]); // Decide if watchlist persists across tab changes
    }
  }, [isActive, recommendationType, hasStartedParty, loadInitialItems]);


  const handlePartyAction = (action: 'add' | 'skip') => {
    if (isLoadingNext || currentIndex >= itemQueue.length) return;

    const item = itemQueue[currentIndex];
    setIsLoadingNext(true);

    let animationType = '';
    if (action === 'add') {
      setPartyWatchlist(prev => [...prev, item]);
      animationType = 'swipe-right';
    } else { // skip
      animationType = 'swipe-left';
    }
    setAnimationAction(animationType);

    setTimeout(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setAnimationAction(null);
      setIsLoadingNext(false);
    }, 400); // Duration of the swipe animation
  };
  
  const partyWatchlistRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (partyWatchlist.length > 0 && partyWatchlistRef.current) {
      partyWatchlistRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [partyWatchlist.length]);


  if (!isActive) {
    return null; // Don't render if tab is not active
  }

  if (!hasStartedParty) {
    return (
      <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full">
        <span dangerouslySetInnerHTML={{ __html: ICONS.watch_party_tab_icon }} className="w-20 h-20 text-purple-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Start a Watch Party!
        </h2>
        <p className="text-slate-300 mb-6 max-w-md">
          Discover {itemTypeString.toLowerCase()} together. Swipe on items, and anything everyone is interested in (conceptually, for now!) will be added to your Party Watchlist.
        </p>
        <button
          onClick={startParty}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-lg"
        >
          Start Discovering for Party
        </button>
      </div>
    );
  }
  
  const noMoreItemsToSwipe = currentIndex >= itemQueue.length && itemQueue.length > 0;

  return (
    <div className="flex flex-col items-center justify-start py-8 px-2 w-full">
      {!noMoreItemsToSwipe && (
        <>
          <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Party Discovery
          </h2>
          <p className="text-slate-300 mb-6 text-center max-w-md text-sm">
            Swipe or tap to decide if this {itemTypeString.toLowerCase()} should be on the party list.
          </p>
          <div className="discovery-card-stack mb-8">
            {itemQueue.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS).reverse().map((item, indexInStackRev) => {
              const actualStackIndex = MAX_VISIBLE_CARDS - 1 - indexInStackRev;
              return (
                <WatchPartyCard
                  key={item.id || `${item.title}-${item.year}`}
                  movie={item}
                  onAction={handlePartyAction}
                  isTopCard={actualStackIndex === 0}
                  stackPosition={actualStackIndex}
                  animationTrigger={actualStackIndex === 0 ? animationAction : null}
                  isLoading={isLoadingNext && actualStackIndex === 0}
                />
              );
            })}
          </div>
          {currentIndex < itemQueue.length && (
            <div className="text-sm text-slate-400 mt-2 text-center">
              Showing {itemTypeString.toLowerCase()} {currentIndex + 1} of {itemQueue.length}.
            </div>
          )}
        </>
      )}

      {noMoreItemsToSwipe && (
         <div className="text-center py-10 px-4">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Swiping Complete!
            </h2>
            <p className="text-slate-300 mb-6">You've gone through all available {itemTypeString.toLowerCase()} for this party session.</p>
        </div>
      )}
      
      {itemQueue.length === 0 && hasStartedParty && (
         <div className="text-center py-10 px-4">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            No {itemTypeString} Left to Discover
            </h2>
            <p className="text-slate-300 mb-6">It seems you've rated all the {itemTypeString.toLowerCase()} in our current discovery pool that haven't been added to your personal feedback yet, or there are none available of this type.</p>
        </div>
      )}

      <div className="w-full mt-10" ref={partyWatchlistRef}>
        <h3 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
          Your Party Watchlist ({partyWatchlist.length})
        </h3>
        {partyWatchlist.length > 0 ? (
          <MovieList movies={partyWatchlist} titleText="" />
        ) : (
          <p className="text-slate-400 text-center">Nothing added to the party list yet. Start swiping above!</p>
        )}
        <div className="text-center mt-8">
            <button
                onClick={clearPartyAndRestart}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
            >
                Clear Party Watchlist & Restart
            </button>
        </div>
      </div>
    </div>
  );
};
