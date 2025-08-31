
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { POPULAR_MOVIES_FOR_SUGGESTION, POPULAR_SERIES_FOR_SUGGESTION, ICONS } from '../constants';

import type { Movie, RecommendationType, PopularItemEntry } from '../types';

import { saveMovieFeedback, getAllFeedback } from '../services/feedbackService';

import { DiscoveryCard } from './DiscoveryCard';

import { LoadingSpinner } from './LoadingSpinner';

import { trackEvent } from '../services/analyticsService';



const MAX_VISIBLE_CARDS = 3;



interface DiscoveryViewProps {

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



export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ isActive, recommendationType }) => {

  const [itemQueue, setItemQueue] = useState<Movie[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [animationAction, setAnimationAction] = useState<string | null>(null);

  const [isLoadingQueue, setIsLoadingQueue] = useState(false); // Changed from isLoadingNext for clarity

  const [sessionSkippedItems, setSessionSkippedItems] = useState<Set<string>>(new Set());

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const feedbackTimeoutRef = useRef<number | null>(null);



  const itemTypeString = recommendationType === 'series' ? 'Series' : 'Movies';

  const popularItemsSource = recommendationType === 'series' ? POPULAR_SERIES_FOR_SUGGESTION : POPULAR_SERIES_FOR_SUGGESTION;



  const loadAndShuffleItems = useCallback(() => {

    setIsLoadingQueue(true);

    const allPreviouslyRated = getAllFeedback();

    const previouslyRatedIds = new Set(allPreviouslyRated.map(fb => `${fb.title}-${fb.year}`));



    const availableItems: Movie[] = popularItemsSource

      .filter(pm => {

        const itemId = `${pm.title}-${pm.year}`; // Consistent ID for filtering

        return !previouslyRatedIds.has(itemId) && !sessionSkippedItems.has(itemId);

      })

      .map((pm: PopularItemEntry) => ({

        id: `${pm.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${pm.year}`, // Consistent ID for Movie objects

        title: pm.title,

        year: pm.year,

        posterUrl: pm.posterUrl,

        summary: `Explore ${pm.title} (${pm.year}) and let us know your thoughts! Your feedback helps tailor future recommendations.`, // Generic summary

        genres: ['Discover'], // Generic genre

      }));



    setItemQueue(shuffleArray(availableItems));

    setCurrentIndex(0);

    setAnimationAction(null);

    setIsLoadingQueue(false);

  }, [popularItemsSource, sessionSkippedItems]);



  useEffect(() => {

    if (isActive) {

      setSessionSkippedItems(new Set()); // Reset skipped items when tab becomes active or type changes

      loadAndShuffleItems();

    } else {

      setItemQueue([]); // Clear queue when tab is not active

      setCurrentIndex(0);

      if (feedbackTimeoutRef.current) {

        clearTimeout(feedbackTimeoutRef.current);

        setFeedbackMessage(null);

      }

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isActive, recommendationType]); // Rerun when recommendationType changes too



  const handleAction = (action: 'skip' | 'loved' | 'liked' | 'notmyvibe') => {

    if (isLoadingQueue || currentIndex >= itemQueue.length) return;



    const item = itemQueue[currentIndex];

    setIsLoadingQueue(true); // Indicate processing



    trackEvent('discovery_action', { title: item.title, year: item.year, action });



    let animationType = '';

    let message = '';

    let feedbackToSave: 'Loved it!' | 'Liked it' | 'Not my vibe' | null = null;



    if (action === 'skip') {

      setSessionSkippedItems(prev => new Set(prev).add(`${item.title}-${item.year}`));

      animationType = 'swipe-left';

      message = `Skipped "${item.title}"`;

    } else {

      if (action === 'loved') {

        animationType = 'swipe-up';

        message = `You loved "${item.title}"! ❤️`;

        feedbackToSave = 'Loved it!';

      } else if (action === 'liked') {

        animationType = 'swipe-right';

        message = `You liked "${item.title}"! 👍`;

        feedbackToSave = 'Liked it';

      } else { // notmyvibe

        animationType = 'swipe-left';

        message = `"${item.title}" wasn't your vibe. Noted!`;

        feedbackToSave = 'Not my vibe';

      }

       saveMovieFeedback(item.title, item.year, feedbackToSave);

    }

    setAnimationAction(animationType);

    setFeedbackMessage(message);



    if (feedbackTimeoutRef.current) {

      clearTimeout(feedbackTimeoutRef.current);

    }

    feedbackTimeoutRef.current = window.setTimeout(() => setFeedbackMessage(null), 2500);



    setTimeout(() => {

      const newIndex = currentIndex + 1;

      setCurrentIndex(newIndex);

      setAnimationAction(null);

      setIsLoadingQueue(false); // Done processing

      

      // If we have swiped the last card from the current queue, try reloading.

      if (newIndex >= itemQueue.length) {

          loadAndShuffleItems();

      }

    }, 400); // Duration of the swipe animation

  };

  

  if (!isActive) return null;



  const currentVisibleItems = itemQueue.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS);



  return (

    <div className="flex flex-col items-center justify-start py-8 px-2 w-full">

      <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">

        Discover & Rate {itemTypeString}

      </h2>

      <p className="text-slate-300 mb-6 text-center max-w-md text-sm">

        Help us learn your taste! Rate these {itemTypeString.toLowerCase()} to get even better recommendations.

      </p>



      {feedbackMessage && (

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm transition-opacity duration-300 animate-pulse">

          {feedbackMessage}

        </div>

      )}



      {isLoadingQueue && currentVisibleItems.length === 0 && (

        <div className="mt-10">

          <LoadingSpinner />

        </div>

      )}



      {!isLoadingQueue && itemQueue.length > 0 && currentVisibleItems.length === 0 && (

        <div className="text-center py-10 px-4">

          <h2 className="text-2xl font-semibold mb-3 text-green-400">All Done For Now!</h2>

          <p className="text-slate-300 mb-4">You've rated all available {itemTypeString.toLowerCase()} in this discovery session.</p>

          <button

            onClick={loadAndShuffleItems}

            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"

          >

            Refresh & Discover More

          </button>

        </div>

      )}



      {currentVisibleItems.length > 0 && (

        <div className="discovery-card-stack mb-8">

          {currentVisibleItems.reverse().map((item, indexInStackRev) => {

            const actualStackIndex = currentVisibleItems.length - 1 - indexInStackRev;

            return (

              <DiscoveryCard

                key={item.id || `${item.title}-${item.year}-${currentIndex + actualStackIndex}`}

                movie={item}

                onAction={handleAction}

                isTopCard={actualStackIndex === 0}

                stackPosition={actualStackIndex}

                animationTrigger={actualStackIndex === 0 ? animationAction : null}

                isLoading={isLoadingQueue && actualStackIndex === 0}

              />

            );

          })}

        </div>

      )}

      

      {!isLoadingQueue && itemQueue.length === 0 && !isActive && (

         <p className="text-slate-400 mt-10">Activate this tab to start discovering.</p>

      )}



       {!isLoadingQueue && itemQueue.length > 0 && currentVisibleItems.length > 0 && (

           <div className="text-sm text-slate-400 mt-2 text-center">

              Showing {itemTypeString.toLowerCase()} {Math.min(currentIndex + 1, itemQueue.length)} of {itemQueue.length}.

            </div>

       )}

    </div>

  );

};