
import React, { useState, useEffect, useCallback } from 'react';
import { POPULAR_MOVIES_FOR_SUGGESTION, ICONS } from '../constants';
import type { Movie } from '../types';
import { saveMovieFeedback, getAllFeedback } from '../services/feedbackService';
import { DiscoveryCard } from './DiscoveryCard';

const MAX_VISIBLE_CARDS = 3; // Top card + 2 peeking

interface DiscoveryViewProps {
  isActive: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ isActive }) => {
  const [movieQueue, setMovieQueue] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationAction, setAnimationAction] = useState<string | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [ratedCountInSession, setRatedCountInSession] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);


  const loadMovies = useCallback(() => {
    const allPreviouslyRated = getAllFeedback();
    const previouslyRatedIds = new Set(allPreviouslyRated.map(fb => `${fb.title}-${fb.year}`));

    const availableMovies: Movie[] = POPULAR_MOVIES_FOR_SUGGESTION
      .filter(pm => !previouslyRatedIds.has(`${pm.title}-${pm.year}`))
      .map(pm => ({
        id: `${pm.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${pm.year}`,
        title: pm.title,
        year: pm.year,
        posterUrl: pm.posterUrl,
        summary: '', 
        genres: [], 
      }));

    setMovieQueue(shuffleArray(availableMovies));
    setCurrentIndex(0);
    setRatedCountInSession(0);
    setAnimationAction(null);
    setIsLoadingNext(false);
    setHasLoadedOnce(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      loadMovies();
    } else {
      // Optionally reset state when tab becomes inactive to free resources or ensure fresh start
      setMovieQueue([]);
      setCurrentIndex(0);
      setAnimationAction(null);
      setRatedCountInSession(0);
      setHasLoadedOnce(false);
    }
  }, [isActive, loadMovies]);

  const handleAction = (action: 'skip' | 'loved' | 'liked' | 'notmyvibe') => {
    if (isLoadingNext || currentIndex >= movieQueue.length) return;

    const movie = movieQueue[currentIndex];
    setIsLoadingNext(true);

    let animationType = '';
    switch (action) {
      case 'loved':
        saveMovieFeedback(movie.title, movie.year, 'Loved it!');
        animationType = 'swipe-right';
        setRatedCountInSession(prev => prev + 1);
        break;
      case 'liked':
        saveMovieFeedback(movie.title, movie.year, 'Liked it');
        animationType = 'swipe-up';
        setRatedCountInSession(prev => prev + 1);
        break;
      case 'notmyvibe':
        saveMovieFeedback(movie.title, movie.year, 'Not my vibe');
        animationType = 'swipe-left';
        setRatedCountInSession(prev => prev + 1);
        break;
      case 'skip':
        animationType = 'swipe-left';
        break;
    }
    setAnimationAction(animationType);

    setTimeout(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setAnimationAction(null);
      setIsLoadingNext(false);
    }, 400);
  };

  if (!isActive && !hasLoadedOnce) { // Initial state before tab is active, or if reset
     return (
      <div className="text-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Discover & Rate Movies
        </h2>
        <p className="text-slate-300">Activate this tab to start discovering movies.</p>
      </div>
    );
  }
  
  if (isActive && !hasLoadedOnce && movieQueue.length === 0) { // Loading state when tab becomes active for the first time
    return (
      <div className="text-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Discover & Rate Movies
        </h2>
        <div className="flex justify-center items-center my-6">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
        </div>
        <p className="text-slate-300">Shuffling the movie deck for you...</p>
      </div>
    );
  }


  if (isActive && hasLoadedOnce && currentIndex >= movieQueue.length && movieQueue.length > 0) {
     return (
      <div className="text-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
          All Done for Now!
        </h2>
        <p className="text-slate-300 mb-2">You've rated {ratedCountInSession} movie{ratedCountInSession === 1 ? '' : 's'} in this session.</p>
        <p className="text-slate-400 mb-6">You've gone through all available popular movies we have for rating right now. Check back later for more!</p>
        <button
            onClick={loadMovies}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
        >
            Start Over / Check for New
        </button>
      </div>
    );
  }
  
  if (isActive && hasLoadedOnce && movieQueue.length === 0) {
     return (
      <div className="text-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
          No Movies to Discover
        </h2>
        <p className="text-slate-300 mb-6">It seems you've rated all the movies in our current discovery pool, or there are none available.</p>
         <p className="text-sm text-slate-400">Check back later or try resetting your rated movies if you wish to see them again (not recommended for best suggestions).</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-start py-8 px-2 w-full">
      <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        Discover & Rate
      </h2>
      <p className="text-slate-300 mb-6 text-center max-w-md text-sm">
        Swipe or tap to rate movies. Your feedback sharpens future recommendations!
      </p>

      <div className="discovery-card-stack">
        {movieQueue.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS).reverse().map((movie, indexInStackRev) => {
          const actualStackIndex = MAX_VISIBLE_CARDS - 1 - indexInStackRev;

          return (
            <DiscoveryCard
              key={movie.id || `${movie.title}-${movie.year}`}
              movie={movie}
              onAction={handleAction}
              isTopCard={actualStackIndex === 0}
              stackPosition={actualStackIndex}
              animationTrigger={actualStackIndex === 0 ? animationAction : null}
              isLoading={isLoadingNext && actualStackIndex === 0}
            />
          );
        })}
      </div>
       { currentIndex < movieQueue.length && (
        <div className="text-sm text-slate-400 mt-8 text-center">
          Showing movie {currentIndex + 1} of {movieQueue.length}. Rated {ratedCountInSession} this session.
        </div>
       )}

      <p className="text-xs text-slate-500 italic text-center mt-4 max-w-xs">
        The more you tell us what you like, the more personalised the movie suggestions get!
      </p>
    </div>
  );
};