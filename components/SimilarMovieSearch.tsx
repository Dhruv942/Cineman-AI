import React, { useState, useEffect, useRef, useCallback } from 'react';
import { POPULAR_MOVIES_FOR_SUGGESTION, POPULAR_SERIES_FOR_SUGGESTION } from '../constants';
import { getItemTitleSuggestions } from '../services/geminiService'; 
import type { ItemTitleSuggestion, RecommendationType, PopularItemEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';


interface SimilarMovieSearchProps {
  onSearch: (movieTitle: string) => void;
  isLoading: boolean;
  isActive: boolean;
  recommendationType: RecommendationType;
  searchContext?: 'similar' | 'tasteCheck';
  initialQuery?: string | null;
  onSearchComplete?: () => void;
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};

export const SimilarMovieSearch: React.FC<SimilarMovieSearchProps> = ({ 
  onSearch, 
  isLoading, 
  isActive, 
  recommendationType, 
  searchContext = 'similar',
  initialQuery,
  onSearchComplete,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [popularPicks, setPopularPicks] = useState<PopularItemEntry[]>([]);
  const [autosuggestResults, setAutosuggestResults] = useState<ItemTitleSuggestion[]>([]);
  const [showAutosuggest, setShowAutosuggest] = useState(false);
  const [isAutosuggestLoading, setIsAutosuggestLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const itemTypeString = recommendationType === 'series' ? t('series', 'Series') : t('movies', 'Movie');
  const itemTypeStringLower = recommendationType === 'series' ? t('series', 'series') : t('movies', 'movie');
  const popularItemsSource = recommendationType === 'series' ? POPULAR_SERIES_FOR_SUGGESTION : POPULAR_MOVIES_FOR_SUGGESTION;

  const mainTitleText = searchContext === 'tasteCheck' 
    ? t('tab_taste_check')
    : t('tab_find_similar');
  
  const buttonText = searchContext === 'tasteCheck' 
    ? t('tab_taste_check')
    : t('tab_find_similar');

  const placeholderText = searchContext === 'tasteCheck'
    ? `Enter a ${itemTypeStringLower} title to check your taste match`
    : `Enter a ${itemTypeStringLower} title (e.g., ${recommendationType === 'movie' ? 'Inception' : 'Breaking Bad'})`;
  
  const subText = searchContext === 'tasteCheck'
    ? `Our AI will analyze the ${itemTypeStringLower} against your preferences to see if it's a good match for you!`
    : `Our AI will try to find the ${itemTypeStringLower} you're thinking of, or something very close to it!`;


  useEffect(() => {
    if (isActive) {
      if (!initialQuery) {
        const shuffled = [...popularItemsSource].sort(() => 0.5 - Math.random());
        setPopularPicks(shuffled.slice(0, 4)); 
      }
      inputRef.current?.focus(); 
    } else {
      setQuery(''); 
      setAutosuggestResults([]);
      setShowAutosuggest(false);
      setIsAutosuggestLoading(false);
    }
  }, [isActive, recommendationType, popularItemsSource, initialQuery]);

  useEffect(() => {
    if (initialQuery && isActive) {
      setQuery(initialQuery);
      onSearch(initialQuery);
      if (onSearchComplete) {
        onSearchComplete();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, isActive]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAutosuggest(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const debouncedGetSuggestions = useCallback(
    debounce(async (currentQuery: string) => {
      if (!currentQuery.trim() || !isActive) {
        setAutosuggestResults([]);
        setShowAutosuggest(false);
        setIsAutosuggestLoading(false);
        return;
      }
      setIsAutosuggestLoading(true);
      if (currentQuery.trim()) {
        setShowAutosuggest(true);
      }
      try {
        const suggestions = await getItemTitleSuggestions(currentQuery, recommendationType);
        
        if (inputRef.current && inputRef.current.value.trim() === currentQuery.trim() && isActive) {
          setAutosuggestResults(suggestions);
          if (suggestions.length > 0) {
            setShowAutosuggest(true);
          } else if (currentQuery.trim().length > 0) { 
            setShowAutosuggest(true); 
          } else { 
            setShowAutosuggest(false);
          }
        } else if (!inputRef.current?.value.trim() || !isActive) { 
           setAutosuggestResults([]);
           setShowAutosuggest(false);
        }
      } catch (error) {
        console.error("Failed to fetch autosuggestions:", error);
        setAutosuggestResults([]);
        if (inputRef.current && inputRef.current.value.trim() === currentQuery.trim() && isActive && currentQuery.trim().length > 0) {
            setShowAutosuggest(true);
        } else {
            setShowAutosuggest(false);
        }
      } finally {
        if (inputRef.current?.value.trim() === currentQuery.trim() || !inputRef.current?.value.trim()) {
            setIsAutosuggestLoading(false);
        }
      }
    }, 300), 
  [isActive, recommendationType]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      debouncedGetSuggestions(value);
    } else {
      setAutosuggestResults([]);
      setShowAutosuggest(false);
      setIsAutosuggestLoading(false); 
    }
  };

  const handleAutosuggestClick = (title: string) => {
    setQuery(title);
    setShowAutosuggest(false);
    setIsAutosuggestLoading(false);
    onSearch(title); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutosuggest(false);
    setIsAutosuggestLoading(false);
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePopularPickClick = (title: string) => { 
    setQuery(title);
    setShowAutosuggest(false);
    setIsAutosuggestLoading(false);
    onSearch(title);
  };

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl text-center">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
        {mainTitleText}
      </h2>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="relative" ref={searchContainerRef}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.trim() && setShowAutosuggest(true)}
                placeholder={placeholderText}
                className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-slate-200 placeholder-slate-400 text-sm w-full sm:w-auto text-center sm:text-left"
                aria-label={searchContext === 'tasteCheck' ? `Check taste match for ${itemTypeStringLower}` : `Search for a ${itemTypeStringLower} similar to`}
                aria-autocomplete="list"
                aria-expanded={showAutosuggest}
                aria-controls="autosuggest-listbox"
                autoComplete="off"
                />
                <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="inline-flex items-center justify-center bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-lg w-full sm:w-auto"
                >
                {isLoading ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                        {searchContext === 'tasteCheck' ? 
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /> :
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        }
                    </svg>
                    {buttonText}
                    </>
                )}
                </button>
            </div>
            { (showAutosuggest && query.trim()) && (
            <div 
                id="autosuggest-listbox"
                role="listbox"
                className="absolute left-0 right-0 mt-1 w-full sm:max-w-md bg-slate-700 border border-slate-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto"
            >
                {isAutosuggestLoading && (
                     <div className="px-4 py-2.5 text-sm text-slate-400 text-center">Loading suggestions...</div>
                )}
                {!isAutosuggestLoading && autosuggestResults.length === 0 && query.trim().length > 0 && (
                     <div className="px-4 py-2.5 text-sm text-slate-400">No suggestions found for "{query}".</div>
                )}
                {!isAutosuggestLoading && autosuggestResults.length > 0 && (
                <ul>
                {autosuggestResults.map(item => (
                    <li key={`${item.title}-${item.year}`} role="option" aria-selected="false">
                    <button
                        type="button"
                        onClick={() => handleAutosuggestClick(item.title)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-sky-600 focus:bg-sky-600 focus:outline-none transition-colors duration-100"
                    >
                        {item.title} <span className="text-slate-400">({item.year})</span>
                    </button>
                    </li>
                ))}
                </ul>
                )}
            </div>
            )}
        </div>
      </form>
       <p className="text-xs text-slate-500 mt-3">
        {subText}
      </p>

      {popularPicks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-sky-300 mb-4">Or get inspired by these popular {recommendationType === 'series' ? 'series' : 'picks'}:</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {popularPicks.map(item => (
              <button
                key={`${item.title}-${item.year}-popular`}
                onClick={() => handlePopularPickClick(item.title)}
                className="bg-slate-700 hover:bg-sky-700 text-slate-200 hover:text-white font-medium py-2 px-4 rounded-lg shadow transition-colors duration-150 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                title={`${searchContext === 'tasteCheck' ? 'Check taste match for' : `Search for ${itemTypeStringLower}s similar to`} ${item.title}`}
              >
                {item.title} <span className="text-slate-400">({item.year})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};