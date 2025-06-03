
import React, { useState, useEffect } from 'react';
import type { Movie } from '../types';
import { ICONS } from '../constants';

const genericFallbackImageUrl = 'https://picsum.photos/seed/fallbackcard/400/600?grayscale&blur=2';

interface DiscoveryCardProps {
  movie: Movie;
  onAction: (action: 'skip' | 'loved' | 'liked' | 'notmyvibe') => void;
  isTopCard: boolean;
  stackPosition: number; // 0 for top, 1 for next, etc.
  animationTrigger: string | null; // e.g., 'swipe-left'
  isLoading: boolean;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  movie,
  onAction,
  isTopCard,
  stackPosition,
  animationTrigger,
  isLoading
}) => {
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);
  const [currentPosterUrl, setCurrentPosterUrl] = useState('');

  const imageIdSeed = movie.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + movie.year;
  const placeholderImageUrl = `https://picsum.photos/seed/${imageIdSeed}/400/600`;

  useEffect(() => {
    setCurrentPosterUrl(movie.posterUrl || placeholderImageUrl);
    setShowFeedbackOptions(false); // Reset when movie changes
  }, [movie, placeholderImageUrl]);

  const handleImageError = () => {
    if (currentPosterUrl === placeholderImageUrl) {
      setCurrentPosterUrl(genericFallbackImageUrl);
    } else if (currentPosterUrl === movie.posterUrl){ // if initial posterUrl failed
      setCurrentPosterUrl(placeholderImageUrl);
    } else { // if placeholder failed, go to generic
      setCurrentPosterUrl(genericFallbackImageUrl);
    }
  };

  const handleWatchedClick = () => {
    if (!isLoading) setShowFeedbackOptions(true);
  };

  const handleFeedbackSelect = (feedback: 'loved' | 'liked' | 'notmyvibe') => {
    if (!isLoading) {
      setShowFeedbackOptions(false);
      onAction(feedback);
    }
  };
  
  const handleHaventWatched = () => {
    if (!isLoading) {
       setShowFeedbackOptions(false);
       onAction('skip'); // Internal logic remains 'skip'
    }
  };

  let cardClassName = "discovery-card";
  if (isTopCard) {
    if (animationTrigger) {
      cardClassName += ` animating-${animationTrigger.replace('swipe-', 'out-')}`;
    } else if (!isLoading) { // Apply enter animation only if not loading and no swipe animation
      cardClassName += ' animating-in';
    }
  } else {
    if (stackPosition === 1) cardClassName += " is-next";
    else if (stackPosition === 2) cardClassName += " is-second-next";
    else cardClassName += " is-hidden"; // For cards beyond the visible stack
  }
  
  return (
    <div className={cardClassName} style={{ zIndex: 100 - stackPosition }}>
      <div className="card-poster-container">
        <img
          src={currentPosterUrl}
          alt={`Poster for ${movie.title}`}
          className="card-poster"
          onError={handleImageError}
        />
      </div>
      <div className="card-info">
        <h3 className="card-title">{movie.title}</h3>
        <p className="card-year">{movie.year}</p>
      </div>
      {isTopCard && (
        <div className="card-actions">
          {showFeedbackOptions ? (
            <>
              <button
                onClick={() => handleFeedbackSelect("loved")}
                disabled={isLoading}
                className="action-button bg-green-500 hover:bg-green-600 text-white"
                aria-label="Loved it"
              >
                😍 Loved
              </button>
              <button
                onClick={() => handleFeedbackSelect("liked")}
                disabled={isLoading}
                className="action-button bg-sky-500 hover:bg-sky-600 text-white"
                aria-label="Liked it"
              >
                😊 Liked
              </button>
              <button
                onClick={() => handleFeedbackSelect("notmyvibe")}
                disabled={isLoading}
                className="action-button bg-red-500 hover:bg-red-600 text-white"
                aria-label="Not my vibe"
              >
                😕 Not My Vibe
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleHaventWatched}
                disabled={isLoading}
                className="action-button bg-slate-600 hover:bg-slate-500 text-white"
                aria-label="Haven't watched this movie"
              >
                <span dangerouslySetInnerHTML={{__html: ICONS.havent_watched_icon}} className="w-5 h-5 mr-1.5" />
                Haven't Watched
              </button>
              <button
                onClick={handleWatchedClick}
                disabled={isLoading}
                className="action-button bg-emerald-500 hover:bg-emerald-600 text-white"
                aria-label="Watched it, show rating options"
              >
                 <span dangerouslySetInnerHTML={{__html: ICONS.watched_it_icon}} className="w-5 h-5 mr-1.5" />
                Watched
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};