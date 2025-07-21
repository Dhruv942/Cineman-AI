
import React, { useState } from 'react';
import type { SessionPreferences, RecommendationType } from '../types';
import { MOVIE_GENRES, ICONS } from '../constants';

interface PreferenceFormProps {
  onSubmit: (preferences: SessionPreferences) => void;
  isLoading: boolean;
  recommendationType: RecommendationType;
}

export const PreferenceForm: React.FC<PreferenceFormProps> = ({ onSubmit, isLoading, recommendationType }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>([]);
  const [showExcludeGenres, setShowExcludeGenres] = useState<boolean>(false);
  const [mood, setMood] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');

  const itemTypeString = recommendationType === 'series' ? 'series' : 'movie';

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      const isCurrentlySelected = prev.includes(genre);
      if (isCurrentlySelected) {
        return prev.filter(g => g !== genre);
      } else {
        if (prev.length < 5) {
          setExcludedGenres(currentExcluded => currentExcluded.filter(ex => ex !== genre));
          return [...prev, genre];
        }
        return prev; 
      }
    });
  };

  const handleExcludeGenreToggle = (genre: string) => {
    setExcludedGenres(prev => {
      const isCurrentlyExcluded = prev.includes(genre);
      if (isCurrentlyExcluded) {
        return prev.filter(g => g !== genre);
      } else {
        setSelectedGenres(currentSelected => currentSelected.filter(sel => sel !== genre));
        return [...prev, genre];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      genres: selectedGenres, 
      excludedGenres: excludedGenres,
      mood, 
      keywords,
    });
  };

  const getGenreIcon = (genre: string) => {
    const iconKey = genre.toLowerCase().replace(/\s+/g, '_').replace('-', '_');
    return (ICONS as any)[iconKey] || ICONS.default_genre;
  };
  
  const QuestionLabel: React.FC<{ htmlFor?: string; id?: string; icon: string; text: string; className?: string; isOptional?: boolean }> = 
  ({ htmlFor, id, icon, text, className = "block text-xl font-semibold mb-4 text-purple-300 text-center", isOptional = false }) => (
    <label htmlFor={htmlFor} id={id} className={className}>
      <span dangerouslySetInnerHTML={{ __html: icon }} className="inline-block align-middle" />
      {text} {isOptional && <span className="text-sm text-slate-400">(optional)</span>}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div>
        <QuestionLabel 
            icon={ICONS.question_genre} 
            text={`What kind of ${itemTypeString} are you in the mood for now? (select up to 5 genres)`} 
        />
        <div className="flex flex-wrap gap-3 justify-center">
          {MOVIE_GENRES.map(genre => (
            <button
              type="button"
              key={`include-${genre}`}
              onClick={() => handleGenreToggle(genre)}
              disabled={selectedGenres.length >= 5 && !selectedGenres.includes(genre)}
              aria-pressed={selectedGenres.includes(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out flex items-center
                ${selectedGenres.includes(genre)
                  ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }
                ${selectedGenres.length >= 5 && !selectedGenres.includes(genre) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span dangerouslySetInnerHTML={{ __html: getGenreIcon(genre) }} />
              {genre}
            </button>
          ))}
        </div>
        {selectedGenres.length >= 5 && <p className="text-xs text-amber-400 mt-2 text-center">Maximum 5 genres selected for inclusion.</p>}
      </div>

      <div className="text-center -mt-6">
        <button
          type="button"
          onClick={() => setShowExcludeGenres(!showExcludeGenres)}
          className="text-sm text-purple-300 hover:text-purple-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-purple-300 rounded px-2 py-1 inline-flex items-center"
          aria-expanded={showExcludeGenres}
          aria-controls="exclude-genres-section"
        >
          {showExcludeGenres ? 'Hide exclusion options' : 'Exclude specific genres?'}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
               className={`w-3 h-3 inline-block ml-1 transform transition-transform duration-200 ${showExcludeGenres ? 'rotate-180' : ''}`}>
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div
        id="exclude-genres-section"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showExcludeGenres ? 'max-h-[500px] opacity-100 mt-2 -mb-4' : 'max-h-0 opacity-0 mt-0' 
        }`}
        aria-hidden={!showExcludeGenres}
      >
        {showExcludeGenres && (
          <div className="border-t border-slate-700 pt-4">
            <QuestionLabel icon={ICONS.horror} text="Genres to Exclude" />
            <p className="text-xs text-slate-400 text-center mb-4">Select genres you'd prefer to avoid.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {MOVIE_GENRES.map(genre => (
                <button
                  type="button"
                  key={`exclude-${genre}`}
                  onClick={() => handleExcludeGenreToggle(genre)}
                  aria-pressed={excludedGenres.includes(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out flex items-center
                    ${excludedGenres.includes(genre)
                      ? 'bg-red-700 text-white shadow-md ring-2 ring-red-400'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }
                  `}
                >
                  <span dangerouslySetInnerHTML={{ __html: getGenreIcon(genre) }} />
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={!showExcludeGenres ? '-mt-4' : ''}> 
        <QuestionLabel icon={ICONS.question_mood} htmlFor="mood" text="Describe the mood, vibe, or plot" isOptional={true} />
        <textarea
          id="mood"
          value={mood}
          onChange={e => setMood(e.target.value)}
          placeholder={`e.g., 'A light-hearted comedy', 'A mind-bending thriller' (optional)`}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-slate-200 placeholder-slate-400 text-sm text-center"
          rows={3}
        />
      </div>
      
      <div>
        <QuestionLabel icon={ICONS.question_keywords} htmlFor="keywords" text="Any specific keywords?" isOptional={true} />
        <input
          type="text"
          id="keywords"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="e.g., 'space exploration, strong female lead, based on a true story'"
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-slate-200 placeholder-slate-400 text-sm text-center"
        />
      </div>

      <div className="mt-10 text-center">
        <button
          type="submit"
          disabled={isLoading}
          className={`group inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-xl w-auto
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Working...
            </>
          ) : (
            <>
             Go!
             <span dangerouslySetInnerHTML={{ __html: ICONS.go_cta }} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};