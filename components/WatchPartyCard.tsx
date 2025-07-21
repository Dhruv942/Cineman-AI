
import React, { useState, useEffect } from 'react';
import type { Movie } from '../types';
import { ICONS } from '../constants';
//ghjuiu
const genericFallbackImageUrl = 'https://picsum.photos/seed/fallbackpartycard/400/600?grayscale&blur=2';

interface WatchPartyCardProps {
  movie: Movie;
  onAction: (action: 'add' | 'skip') => void;
  isTopCard: boolean;
  stackPosition: number;
  animationTrigger: string | null;
  isLoading: boolean;
}

export const WatchPartyCard: React.FC<WatchPartyCardProps> = ({
  movie,
  onAction,
  isTopCard,
  stackPosition,
  animationTrigger,
  isLoading
}) => {
  const [currentPosterUrl, setCurrentPosterUrl] = useState('');

  const imageIdSeed = movie.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + movie.year;
  const placeholderImageUrl = `https://picsum.photos/seed/${imageIdSeed}/400/600`;

  useEffect(() => {
    setCurrentPosterUrl(movie.posterUrl || placeholderImageUrl);
  }, [movie, placeholderImageUrl]);

  const handleImageError = () => {
    if (currentPosterUrl === placeholderImageUrl) {
      setCurrentPosterUrl(genericFallbackImageUrl);
    } else if (currentPosterUrl === movie.posterUrl){
      setCurrentPosterUrl(placeholderImageUrl);
    } else {
      setCurrentPosterUrl(genericFallbackImageUrl);
    }
  };

  let cardClassName = "discovery-card"; // Re-use styling from discovery-card
  if (isTopCard) {
    if (animationTrigger) {
      cardClassName += ` animating-${animationTrigger.replace('swipe-', 'out-')}`;
    } else if (!isLoading) {
      cardClassName += ' animating-in';
    }
  } else {
    if (stackPosition === 1) cardClassName += " is-next";
    else if (stackPosition === 2) cardClassName += " is-second-next";
    else cardClassName += " is-hidden";
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
          <button
            onClick={() => onAction('skip')}
            disabled={isLoading}
            className="action-button bg-slate-600 hover:bg-slate-500 text-white"
            aria-label="Skip this item for the party"
          >
            <span dangerouslySetInnerHTML={{__html: ICONS.skip_for_party_icon}} className="w-5 h-5 mr-1.5" />
            Skip for Party
          </button>
          <button
            onClick={() => onAction('add')}
            disabled={isLoading}
            className="action-button bg-green-500 hover:bg-green-600 text-white"
            aria-label="Add this item to the party list"
          >
             <span dangerouslySetInnerHTML={{__html: ICONS.add_to_party_icon}} className="w-5 h-5 mr-1.5" />
            Add to Party List
          </button>
        </div>
      )}
    </div>
  );
};
