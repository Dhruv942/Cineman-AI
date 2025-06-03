
import React from 'react';
import type { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface MovieListProps {
  movies: Movie[];
  titleRef?: React.RefObject<HTMLHeadingElement>;
  titleText?: string; // New optional prop for custom title
}

export const MovieList: React.FC<MovieListProps> = ({ movies, titleRef, titleText }) => {
  if (movies.length === 0) {
    return null;
  }

  const displayTitle = titleText || "Your Personalised Movie Recommendations"; // Default if not provided

  return (
    <div className="mt-12">
      <h2 
        ref={titleRef}
        id="movie-list-title" // More generic ID
        className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
        tabIndex={-1} 
      >
        {displayTitle}
      </h2>
      {movies.length === 1 ? (
        <div className="flex justify-center px-2"> {/* Added padding for small screens */}
          <div className="w-full max-w-sm"> {/* Container to constrain the single MovieCard */}
            <MovieCard movie={movies[0]} />
          </div>
        </div>
      ) : (
        <div 
          className={`grid gap-6 xl:gap-8 ${
            movies.length === 2 
            ? 'grid-cols-1 sm:grid-cols-2 md:max-w-5xl mx-auto' // For 2 items, use 2 cols on sm+, limit max width on md+
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' // For 3+ items
          }`}
        >
          {movies.map((movie, index) => (
            <MovieCard key={`${movie.id || movie.title}-${index}-${movie.matchScore || 'ns'}`} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};